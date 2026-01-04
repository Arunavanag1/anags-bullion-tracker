import asyncio
import random
import re
import logging
import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict, Any

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

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


class PCGSScraper:
    def __init__(self, db: Session):
        self.db = db
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        )
        self.stats = {
            'coins_scraped': 0,
            'coins_failed': 0,
            'prices_scraped': 0,
        }

    async def close(self):
        await self.client.aclose()

    async def _polite_request(self, url: str, retry: int = 0) -> Optional[str]:
        """Make a request with rate limiting and retries"""
        # Random delay between requests
        await asyncio.sleep(REQUEST_DELAY_MIN + random.random() * (REQUEST_DELAY_MAX - REQUEST_DELAY_MIN))

        try:
            response = await self.client.get(url)
            response.raise_for_status()
            return response.text
        except httpx.HTTPError as e:
            logger.warning(f"Request failed for {url}: {e}")
            if retry < MAX_RETRIES:
                wait_time = RETRY_BACKOFF ** retry
                logger.info(f"Retrying in {wait_time}s (attempt {retry + 1}/{MAX_RETRIES})")
                await asyncio.sleep(wait_time)
                return await self._polite_request(url, retry + 1)
            else:
                logger.error(f"Max retries exceeded for {url}")
                return None

    async def scrape_series(self, series_name: str, slug: str, category_id: int) -> List[Dict]:
        """Scrape all coins in a series"""
        logger.info(f"Scraping series: {series_name}")

        url = f"{PCGS_CATEGORY_URL}/{slug}/{category_id}"
        html = await self._polite_request(url)

        if not html:
            logger.error(f"Failed to fetch series page: {series_name}")
            return []

        soup = BeautifulSoup(html, 'html.parser')
        coins = []

        # Find coin entries - adjust selectors based on actual page structure
        coin_rows = soup.select('.pcgs-table tbody tr, .coin-list-item, [data-pcgs-number]')

        for row in coin_rows:
            try:
                coin_data = self._parse_coin_row(row, series_name)
                if coin_data:
                    coins.append(coin_data)
            except Exception as e:
                logger.warning(f"Failed to parse coin row: {e}")

        logger.info(f"Found {len(coins)} coins in {series_name}")
        return coins

    def _parse_coin_row(self, row, series_name: str) -> Optional[Dict]:
        """Parse a coin row from the series listing"""
        # Try to find PCGS number
        pcgs_num = None

        # Check data attribute
        if row.get('data-pcgs-number'):
            pcgs_num = int(row['data-pcgs-number'])

        # Check for link to coin detail page
        link = row.select_one('a[href*="/coin/detail/"]')
        if link and not pcgs_num:
            href = link.get('href', '')
            match = re.search(r'/coin/detail/(\d+)', href)
            if match:
                pcgs_num = int(match.group(1))

        if not pcgs_num:
            return None

        # Get coin name
        name_elem = row.select_one('.coin-name, .description, td:first-child a')
        full_name = name_elem.get_text(strip=True) if name_elem else f"PCGS# {pcgs_num}"

        # Parse year and mint mark from name
        year_match = re.search(r'(\d{4})', full_name)
        year = int(year_match.group(1)) if year_match else None

        mint_mark_match = re.search(r'-([DSWOPCC]+)\s', full_name)
        mint_mark = mint_mark_match.group(1) if mint_mark_match else None

        return {
            'pcgs_number': pcgs_num,
            'year': year,
            'mint_mark': mint_mark,
            'series': series_name,
            'full_name': full_name,
        }

    async def scrape_coin_detail(self, pcgs_number: int) -> Optional[Dict]:
        """Scrape detailed info and prices for a specific coin"""
        url = f"{PCGS_COIN_DETAIL_URL}/{pcgs_number}"
        html = await self._polite_request(url)

        if not html:
            logger.error(f"Failed to fetch coin detail: {pcgs_number}")
            return None

        soup = BeautifulSoup(html, 'html.parser')

        # Parse coin details
        detail = {
            'pcgs_number': pcgs_number,
            'prices': {},
        }

        # Get full name/title
        title = soup.select_one('h1, .coin-title, .coin-name')
        if title:
            detail['full_name'] = title.get_text(strip=True)

        # Parse denomination
        denom_elem = soup.select_one('[data-denomination], .denomination')
        if denom_elem:
            detail['denomination'] = denom_elem.get_text(strip=True)

        # Parse variety
        variety_elem = soup.select_one('.variety, .coin-variety')
        if variety_elem:
            detail['variety'] = variety_elem.get_text(strip=True)

        # Parse mintage
        mintage_elem = soup.select_one('[data-mintage], .mintage')
        if mintage_elem:
            mintage_text = mintage_elem.get_text(strip=True)
            mintage_match = re.search(r'[\d,]+', mintage_text.replace(',', ''))
            if mintage_match:
                detail['mintage'] = int(mintage_match.group().replace(',', ''))

        # Parse price guide table
        price_table = soup.select_one('.price-guide-table, .pcgs-price-guide, table')
        if price_table:
            for row in price_table.select('tr'):
                cells = row.select('td, th')
                if len(cells) >= 2:
                    grade_text = cells[0].get_text(strip=True)
                    price_text = cells[1].get_text(strip=True)

                    # Parse grade (e.g., "MS65", "PR70")
                    grade_match = re.match(r'^(MS|PR|AU|EF|VF|F|VG|G|AG|FR|PO)\d+', grade_text)
                    if grade_match:
                        grade = grade_match.group()

                        # Parse price
                        price_match = re.search(r'\$?([\d,]+)', price_text)
                        if price_match:
                            price = Decimal(price_match.group(1).replace(',', ''))
                            detail['prices'][grade] = price

        return detail

    async def scrape_and_save_series(self, series_name: str, slug: str, category_id: int):
        """Scrape a series and save to database"""
        logger.info(f"Starting scrape for {series_name}")

        # Get list of coins in series
        coins = await self.scrape_series(series_name, slug, category_id)

        for coin_data in coins:
            try:
                # Get detailed info
                detail = await self.scrape_coin_detail(coin_data['pcgs_number'])

                if detail:
                    # Merge data
                    coin_data.update(detail)

                    # Save to database
                    await self._save_coin(coin_data)
                    self.stats['coins_scraped'] += 1
                else:
                    self.stats['coins_failed'] += 1

            except Exception as e:
                logger.error(f"Error processing coin {coin_data.get('pcgs_number')}: {e}")
                self.stats['coins_failed'] += 1

        logger.info(f"Completed {series_name}: {self.stats['coins_scraped']} scraped, {self.stats['coins_failed']} failed")

    async def _save_coin(self, coin_data: Dict):
        """Save coin and prices to database"""
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
            # Check if price guide entry exists
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


async def run_scraper(db: Session, series_filter: str = None, priority_filter: str = None):
    """Main entry point for running the scraper"""
    from config import COIN_SERIES

    scraper = PCGSScraper(db)

    try:
        for series in COIN_SERIES:
            # Apply filters
            if series_filter and series['slug'] != series_filter:
                continue
            if priority_filter and series['priority'] != priority_filter:
                continue

            await scraper.scrape_and_save_series(
                series['name'],
                series['slug'],
                series['category_id']
            )

        logger.info(f"Scraping complete. Stats: {scraper.stats}")
        return scraper.stats

    finally:
        await scraper.close()
