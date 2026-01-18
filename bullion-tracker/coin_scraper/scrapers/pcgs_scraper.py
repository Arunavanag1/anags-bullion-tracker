"""
PCGS CoinFacts Scraper with enhanced session management and selector fallbacks.

Features:
- Persistent session with cookie management
- Multiple selector fallback chains for robustness
- Improved retry logic with session refresh on 403
- Better logging of which selectors matched
"""

import asyncio
import random
import re
import logging
import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path

import httpx
from bs4 import BeautifulSoup, Tag
from sqlalchemy.orm import Session

import sys
sys.path.append('..')

from config import (
    PCGS_CATEGORY_URL, PCGS_COIN_DETAIL_URL,
    REQUEST_DELAY_MIN, REQUEST_DELAY_MAX, MAX_RETRIES, RETRY_BACKOFF, USER_AGENT
)
from models.coin_reference import CoinReference
from models.coin_price_guide import CoinPriceGuide

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Selector chains - try each in order until one matches
SERIES_SELECTORS = [
    '.pcgs-table tbody tr',
    '.coin-list-item',
    '[data-pcgs-number]',
    '.coinfacts-list tr',
    'table.coins tbody tr',
    '.coin-row',
    'div[data-coin-id]',
]

COIN_LINK_SELECTORS = [
    'a[href*="/coin/detail/"]',
    'a[href*="/coinfacts/coin/"]',
    'a.coin-link',
    'a[data-pcgs]',
]

COIN_NAME_SELECTORS = [
    '.coin-name',
    '.description',
    'td:first-child a',
    '.coin-title',
    '.coin-description',
    '[data-name]',
]

TITLE_SELECTORS = [
    'h1.coin-title',
    'h1',
    '.coin-title',
    '.coin-name',
    '.page-title',
]

DENOMINATION_SELECTORS = [
    '[data-denomination]',
    '.denomination',
    '.coin-denomination',
    '.denom',
]

VARIETY_SELECTORS = [
    '.variety',
    '.coin-variety',
    '.variety-name',
    '[data-variety]',
]

MINTAGE_SELECTORS = [
    '[data-mintage]',
    '.mintage',
    '.coin-mintage',
    '.mint-info',
]

PRICE_TABLE_SELECTORS = [
    '.price-guide-table',
    '.pcgs-price-guide',
    'table.prices',
    'table.price-guide',
    '#price-guide table',
    'table',
]

# NGC cross-reference selectors
NGC_SELECTORS = [
    '[data-ngc-number]',
    '.ngc-number',
    '.ngc-cert',
    'span.ngc',
]


class PCGSScraper:
    """Enhanced PCGS scraper with session management and selector fallbacks."""

    def __init__(self, db: Session, progress_tracker=None):
        self.db = db
        self.progress_tracker = progress_tracker
        self._session_cookies: Dict[str, str] = {}
        self._session_refresh_count = 0
        self.client = self._create_client()
        self.stats = {
            'coins_scraped': 0,
            'coins_failed': 0,
            'prices_scraped': 0,
            'selectors_matched': {},  # Track which selectors work
            'http_errors': {},  # Track error types
        }

    def _create_client(self) -> httpx.AsyncClient:
        """Create HTTP client with browser-like headers."""
        return httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            },
            cookies=self._session_cookies,
        )

    async def _refresh_session(self):
        """Refresh session by visiting homepage to get fresh cookies."""
        self._session_refresh_count += 1
        logger.info(f"Refreshing session (attempt {self._session_refresh_count})")

        await self.client.aclose()
        self._session_cookies = {}
        self.client = self._create_client()

        # Visit homepage to get cookies
        try:
            response = await self.client.get("https://www.pcgs.com/coinfacts")
            if response.status_code == 200:
                # Store cookies from response
                for cookie in response.cookies.jar:
                    self._session_cookies[cookie.name] = cookie.value
                logger.info(f"Session refreshed, got {len(self._session_cookies)} cookies")
            await asyncio.sleep(2)  # Polite delay after session refresh
        except Exception as e:
            logger.warning(f"Failed to refresh session: {e}")

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def _polite_request(self, url: str, retry: int = 0) -> Tuple[Optional[str], int]:
        """
        Make a request with rate limiting, retries, and session management.

        Returns:
            Tuple of (html_content or None, status_code)
        """
        # Random delay between requests (polite scraping)
        delay = REQUEST_DELAY_MIN + random.random() * (REQUEST_DELAY_MAX - REQUEST_DELAY_MIN)
        await asyncio.sleep(delay)

        try:
            response = await self.client.get(url)
            status = response.status_code

            # Handle 403 Forbidden - try session refresh
            if status == 403:
                self.stats['http_errors']['403'] = self.stats['http_errors'].get('403', 0) + 1
                if retry < MAX_RETRIES:
                    logger.warning(f"Got 403 for {url}, refreshing session...")
                    await self._refresh_session()
                    return await self._polite_request(url, retry + 1)
                else:
                    logger.error(f"403 Forbidden after {MAX_RETRIES} retries: {url}")
                    return None, 403

            # Handle rate limiting (429)
            if status == 429:
                self.stats['http_errors']['429'] = self.stats['http_errors'].get('429', 0) + 1
                wait_time = int(response.headers.get('Retry-After', 60))
                logger.warning(f"Rate limited, waiting {wait_time}s...")
                await asyncio.sleep(wait_time)
                return await self._polite_request(url, retry + 1)

            response.raise_for_status()
            return response.text, status

        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            self.stats['http_errors'][str(status)] = self.stats['http_errors'].get(str(status), 0) + 1
            logger.warning(f"HTTP {status} for {url}: {e}")
            if retry < MAX_RETRIES:
                wait_time = RETRY_BACKOFF ** retry
                logger.info(f"Retrying in {wait_time}s (attempt {retry + 1}/{MAX_RETRIES})")
                await asyncio.sleep(wait_time)
                return await self._polite_request(url, retry + 1)
            return None, status

        except httpx.RequestError as e:
            self.stats['http_errors']['network'] = self.stats['http_errors'].get('network', 0) + 1
            logger.warning(f"Network error for {url}: {e}")
            if retry < MAX_RETRIES:
                wait_time = RETRY_BACKOFF ** retry
                logger.info(f"Retrying in {wait_time}s (attempt {retry + 1}/{MAX_RETRIES})")
                await asyncio.sleep(wait_time)
                return await self._polite_request(url, retry + 1)
            return None, 0

    def _try_selectors(self, soup: BeautifulSoup, selectors: List[str], context: str = "") -> List[Tag]:
        """Try multiple selectors in order, return first match."""
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                # Track which selector worked
                key = f"{context}:{selector}" if context else selector
                self.stats['selectors_matched'][key] = self.stats['selectors_matched'].get(key, 0) + 1
                logger.debug(f"Selector matched: {selector} ({len(elements)} elements)")
                return elements
        return []

    def _try_selector_one(self, soup: BeautifulSoup, selectors: List[str], context: str = "") -> Optional[Tag]:
        """Try multiple selectors in order, return first single match."""
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                key = f"{context}:{selector}" if context else selector
                self.stats['selectors_matched'][key] = self.stats['selectors_matched'].get(key, 0) + 1
                logger.debug(f"Selector matched: {selector}")
                return element
        return None

    async def scrape_series(self, series_name: str, slug: str, category_id: int) -> List[Dict]:
        """Scrape all coins in a series with fallback selectors."""
        logger.info(f"Scraping series: {series_name}")

        url = f"{PCGS_CATEGORY_URL}/{slug}/{category_id}"
        html, status = await self._polite_request(url)

        if not html:
            logger.error(f"Failed to fetch series page: {series_name} (status: {status})")
            return []

        soup = BeautifulSoup(html, 'html.parser')
        coins = []

        # Try selector chains for coin rows
        coin_rows = self._try_selectors(soup, SERIES_SELECTORS, "series")

        if not coin_rows:
            logger.warning(f"No coin rows found for {series_name} with any selector")
            # Log page structure for debugging
            all_tables = soup.find_all('table')
            all_divs_with_data = soup.find_all(attrs={'data-pcgs-number': True})
            logger.debug(f"Page has {len(all_tables)} tables, {len(all_divs_with_data)} data-pcgs elements")

        for row in coin_rows:
            try:
                coin_data = self._parse_coin_row(row, series_name)
                if coin_data:
                    coins.append(coin_data)
            except Exception as e:
                logger.warning(f"Failed to parse coin row: {e}")

        logger.info(f"Found {len(coins)} coins in {series_name}")
        return coins

    def _parse_coin_row(self, row: Tag, series_name: str) -> Optional[Dict]:
        """Parse a coin row with fallback selectors."""
        pcgs_num = None

        # Strategy 1: Check data attribute
        if row.get('data-pcgs-number'):
            pcgs_num = int(row['data-pcgs-number'])

        # Strategy 2: Check data-coin-id
        if not pcgs_num and row.get('data-coin-id'):
            pcgs_num = int(row['data-coin-id'])

        # Strategy 3: Check for link to coin detail page with fallback selectors
        if not pcgs_num:
            for selector in COIN_LINK_SELECTORS:
                link = row.select_one(selector)
                if link:
                    href = link.get('href', '')
                    # Try multiple URL patterns
                    patterns = [
                        r'/coin/detail/(\d+)',
                        r'/coinfacts/coin/(\d+)',
                        r'pcgs[_-]?(?:number|num|id)[=:](\d+)',
                        r'/(\d{4,8})(?:\?|$|/)',  # Just a number at end of URL
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, href, re.IGNORECASE)
                        if match:
                            pcgs_num = int(match.group(1))
                            break
                if pcgs_num:
                    break

        if not pcgs_num:
            return None

        # Get coin name with fallback selectors
        name_elem = None
        for selector in COIN_NAME_SELECTORS:
            name_elem = row.select_one(selector)
            if name_elem:
                break

        full_name = name_elem.get_text(strip=True) if name_elem else f"PCGS# {pcgs_num}"

        # Parse year from name (multiple patterns)
        year = None
        year_patterns = [
            r'\b(1[789]\d{2}|20[012]\d)\b',  # 1700s-2020s
            r'^(\d{4})',  # Year at start
        ]
        for pattern in year_patterns:
            year_match = re.search(pattern, full_name)
            if year_match:
                year = int(year_match.group(1))
                break

        # Parse mint mark (improved pattern)
        mint_mark = None
        mint_patterns = [
            r'-([DSWOPCC]+)\s',  # Hyphenated
            r'\s([DSWOPCC])\s',  # Single letter
            r'\(([DSWOPCC]+)\)',  # Parenthesized
        ]
        for pattern in mint_patterns:
            mm_match = re.search(pattern, full_name)
            if mm_match:
                mint_mark = mm_match.group(1)
                break

        return {
            'pcgs_number': pcgs_num,
            'year': year,
            'mint_mark': mint_mark,
            'series': series_name,
            'full_name': full_name,
        }

    async def scrape_coin_detail(self, pcgs_number: int) -> Optional[Dict]:
        """Scrape detailed info and prices with fallback selectors."""
        url = f"{PCGS_COIN_DETAIL_URL}/{pcgs_number}"
        html, status = await self._polite_request(url)

        if not html:
            logger.error(f"Failed to fetch coin detail: {pcgs_number} (status: {status})")
            return None

        soup = BeautifulSoup(html, 'html.parser')

        detail: Dict[str, Any] = {
            'pcgs_number': pcgs_number,
            'prices': {},
        }

        # Get full name/title
        title = self._try_selector_one(soup, TITLE_SELECTORS, "title")
        if title:
            detail['full_name'] = title.get_text(strip=True)

        # Parse denomination
        denom_elem = self._try_selector_one(soup, DENOMINATION_SELECTORS, "denomination")
        if denom_elem:
            detail['denomination'] = denom_elem.get_text(strip=True)

        # Parse variety
        variety_elem = self._try_selector_one(soup, VARIETY_SELECTORS, "variety")
        if variety_elem:
            detail['variety'] = variety_elem.get_text(strip=True)

        # Parse mintage
        mintage_elem = self._try_selector_one(soup, MINTAGE_SELECTORS, "mintage")
        if mintage_elem:
            mintage_text = mintage_elem.get_text(strip=True)
            # Remove commas and find number
            mintage_match = re.search(r'([\d,]+)', mintage_text)
            if mintage_match:
                detail['mintage'] = int(mintage_match.group(1).replace(',', ''))

        # Parse NGC number if available
        ngc_elem = self._try_selector_one(soup, NGC_SELECTORS, "ngc")
        if ngc_elem:
            ngc_text = ngc_elem.get_text(strip=True)
            ngc_match = re.search(r'(\d+)', ngc_text)
            if ngc_match:
                detail['ngc_number'] = int(ngc_match.group(1))

        # Parse price guide table
        price_table = self._try_selector_one(soup, PRICE_TABLE_SELECTORS, "price_table")
        if price_table:
            for row in price_table.select('tr'):
                cells = row.select('td, th')
                if len(cells) >= 2:
                    grade_text = cells[0].get_text(strip=True)
                    price_text = cells[1].get_text(strip=True)

                    # Parse grade (e.g., "MS65", "PR70", "AU58")
                    grade_match = re.match(r'^(MS|PR|PF|AU|EF|XF|VF|F|VG|G|AG|FR|PO|SP|BN|RB|RD)\d+', grade_text, re.IGNORECASE)
                    if grade_match:
                        grade = grade_match.group().upper()

                        # Parse price (handle $, commas, and decimals)
                        price_match = re.search(r'\$?\s*([\d,]+(?:\.\d{2})?)', price_text)
                        if price_match:
                            try:
                                price = Decimal(price_match.group(1).replace(',', ''))
                                detail['prices'][grade] = price
                            except Exception:
                                pass

        return detail

    async def scrape_and_save_series(self, series_name: str, slug: str, category_id: int):
        """Scrape a series and save to database."""
        logger.info(f"Starting scrape for {series_name}")

        # Track progress if tracker available
        if self.progress_tracker:
            self.progress_tracker.mark_series_started(slug)

        # Get list of coins in series
        coins = await self.scrape_series(series_name, slug, category_id)

        for coin_data in coins:
            pcgs_num = coin_data.get('pcgs_number')

            # Check if already scraped (resume capability)
            if self.progress_tracker and self.progress_tracker.is_coin_complete(pcgs_num):
                logger.debug(f"Skipping already scraped coin: {pcgs_num}")
                continue

            try:
                # Get detailed info
                detail = await self.scrape_coin_detail(pcgs_num)

                if detail:
                    # Merge data
                    coin_data.update(detail)

                    # Save to database
                    await self._save_coin(coin_data)
                    self.stats['coins_scraped'] += 1

                    if self.progress_tracker:
                        self.progress_tracker.mark_coin_complete(pcgs_num)
                else:
                    self.stats['coins_failed'] += 1
                    if self.progress_tracker:
                        self.progress_tracker.mark_coin_failed(pcgs_num)

            except Exception as e:
                logger.error(f"Error processing coin {pcgs_num}: {e}")
                self.stats['coins_failed'] += 1
                if self.progress_tracker:
                    self.progress_tracker.mark_coin_failed(pcgs_num)

        # Mark series complete
        if self.progress_tracker:
            self.progress_tracker.mark_series_complete(slug)

        logger.info(f"Completed {series_name}: {self.stats['coins_scraped']} scraped, {self.stats['coins_failed']} failed")

    async def _save_coin(self, coin_data: Dict):
        """Save coin and prices to database."""
        # Generate search tokens
        search_text = CoinReference.generate_search_tokens(
            coin_data.get('year'),
            coin_data.get('mint_mark'),
            coin_data.get('denomination'),
            coin_data.get('series'),
            coin_data.get('variety'),
            coin_data.get('full_name'),
        )

        # Create or update coin reference
        coin_ref = self.db.query(CoinReference).filter(
            CoinReference.pcgsNumber == coin_data['pcgs_number']
        ).first()

        if not coin_ref:
            coin_ref = CoinReference(
                id=str(uuid.uuid4()),
                pcgsNumber=coin_data['pcgs_number'],
                year=coin_data.get('year'),
                mintMark=coin_data.get('mint_mark'),
                denomination=coin_data.get('denomination'),
                series=coin_data.get('series'),
                variety=coin_data.get('variety'),
                mintage=coin_data.get('mintage'),
                fullName=coin_data.get('full_name', f"PCGS# {coin_data['pcgs_number']}"),
                searchTokens=search_text,
            )
            self.db.add(coin_ref)
        else:
            coin_ref.year = coin_data.get('year')
            coin_ref.mintMark = coin_data.get('mint_mark')
            coin_ref.denomination = coin_data.get('denomination')
            coin_ref.variety = coin_data.get('variety')
            coin_ref.mintage = coin_data.get('mintage')
            coin_ref.fullName = coin_data.get('full_name')
            coin_ref.searchTokens = search_text

        self.db.commit()
        self.db.refresh(coin_ref)

        # Save prices
        today = date.today()
        for grade, price in coin_data.get('prices', {}).items():
            existing = self.db.query(CoinPriceGuide).filter(
                CoinPriceGuide.coinReferenceId == coin_ref.id,
                CoinPriceGuide.gradeCode == grade,
                CoinPriceGuide.priceDate == today
            ).first()

            if not existing:
                price_guide = CoinPriceGuide(
                    id=str(uuid.uuid4()),
                    coinReferenceId=coin_ref.id,
                    gradeCode=grade,
                    pcgsPrice=price,
                    priceDate=today,
                )
                self.db.add(price_guide)
            else:
                existing.pcgsPrice = price

            self.stats['prices_scraped'] += 1

        self.db.commit()
        logger.debug(f"Saved coin {coin_data['pcgs_number']}: {coin_data.get('full_name')}")

    def get_stats_summary(self) -> str:
        """Get a formatted summary of scraping stats."""
        lines = [
            "=== Scraping Statistics ===",
            f"Coins scraped: {self.stats['coins_scraped']}",
            f"Coins failed: {self.stats['coins_failed']}",
            f"Prices scraped: {self.stats['prices_scraped']}",
            f"Session refreshes: {self._session_refresh_count}",
        ]

        if self.stats['http_errors']:
            lines.append("\nHTTP Errors:")
            for code, count in sorted(self.stats['http_errors'].items()):
                lines.append(f"  {code}: {count}")

        if self.stats['selectors_matched']:
            lines.append("\nTop Selectors Used:")
            sorted_selectors = sorted(
                self.stats['selectors_matched'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            for selector, count in sorted_selectors:
                lines.append(f"  {selector}: {count}")

        return "\n".join(lines)


async def run_scraper(db: Session, series_filter: str = None, priority_filter: str = None, progress_tracker=None):
    """Main entry point for running the scraper."""
    from config import COIN_SERIES

    scraper = PCGSScraper(db, progress_tracker=progress_tracker)

    try:
        for series in COIN_SERIES:
            # Apply filters
            if series_filter and series['slug'] != series_filter:
                continue
            if priority_filter and series.get('priority') != priority_filter:
                continue

            # Check if series already complete (resume capability)
            if progress_tracker and progress_tracker.is_series_complete(series['slug']):
                logger.info(f"Skipping already complete series: {series['name']}")
                continue

            await scraper.scrape_and_save_series(
                series['name'],
                series['slug'],
                series['category_id']
            )

        logger.info(scraper.get_stats_summary())
        return scraper.stats

    finally:
        await scraper.close()
