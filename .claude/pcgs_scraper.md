# Claude Code Prompt: PCGS Coin Reference Database Scraper

## Overview

Build a Python scraper to populate a coin reference database from PCGS CoinFacts. This database will power the coin tracker feature of my bullion collection app, enabling users to search for coins by name/year and automatically pull pricing data.

**IMPORTANT**: Run this scraper BEFORE implementing the main coin tracker feature, as the coin_references and coin_price_guide tables need to be populated first.

## Tech Stack

- Python 3.11+
- httpx (async HTTP client)
- BeautifulSoup4 (HTML parsing)
- PostgreSQL with SQLAlchemy ORM
- Celery (for scheduled refreshes)
- python-dotenv (for environment variables)

## Database Schema

Create these tables before scraping:

```sql
-- Core reference table
CREATE TABLE coin_references (
    id SERIAL PRIMARY KEY,
    pcgs_number INTEGER UNIQUE NOT NULL,
    ngc_number INTEGER,
    year INTEGER NOT NULL,
    mint_mark VARCHAR(5),
    denomination VARCHAR(50) NOT NULL,
    series VARCHAR(100) NOT NULL,
    variety VARCHAR(200),
    metal VARCHAR(20),
    weight_oz DECIMAL(10, 4),
    fineness DECIMAL(5, 4),
    mintage INTEGER,
    full_name VARCHAR(300) NOT NULL,
    search_tokens TSVECTOR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coin_search ON coin_references USING GIN(search_tokens);
CREATE INDEX idx_coin_pcgs ON coin_references(pcgs_number);
CREATE INDEX idx_coin_series ON coin_references(series);
CREATE INDEX idx_coin_year ON coin_references(year);

-- Valid grades lookup
CREATE TABLE valid_grades (
    id SERIAL PRIMARY KEY,
    grade_code VARCHAR(10) UNIQUE NOT NULL,
    numeric_value INTEGER NOT NULL,
    grade_category VARCHAR(30) NOT NULL,
    display_order INTEGER NOT NULL
);

-- Price guide data (refreshed weekly)
CREATE TABLE coin_price_guide (
    id SERIAL PRIMARY KEY,
    coin_reference_id INTEGER REFERENCES coin_references(id) ON DELETE CASCADE,
    grade_code VARCHAR(10) REFERENCES valid_grades(grade_code),
    pcgs_price DECIMAL(12, 2),
    price_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(coin_reference_id, grade_code, price_date)
);

CREATE INDEX idx_price_lookup ON coin_price_guide(coin_reference_id, grade_code);
```

## Target Series to Scrape

Scrape these PCGS CoinFacts categories in order of priority:

| Series | PCGS Category ID | Priority | Est. Coins |
|--------|------------------|----------|------------|
| Silver Eagles | 833 | P0 | ~80 |
| Gold Eagles | 835 | P0 | ~150 |
| Morgan Dollars | 53 | P0 | ~100 |
| Lincoln Cents | 37 | P0 | ~300 |
| Jefferson Nickels | 39 | P0 | ~200 |
| Peace Dollars | 54 | P1 | ~25 |
| Barber Dimes | 44 | P1 | ~75 |
| Barber Quarters | 49 | P1 | ~75 |
| Barber Halves | 52 | P1 | ~75 |
| Walking Liberty Halves | 51 | P1 | ~65 |
| Franklin Halves | 50 | P1 | ~35 |

**Total: ~1,180 coins**

## PCGS CoinFacts URL Structure

**Series listing page:**
```
https://www.pcgs.com/coinfacts/category/{series-slug}/{category-id}
Example: https://www.pcgs.com/coinfacts/category/silver-eagles/833
```

**Individual coin page:**
```
https://www.pcgs.com/coinfacts/coin/detail/{pcgs-number}
Example: https://www.pcgs.com/coinfacts/coin/detail/9801
```

## Scraper Requirements

### 1. Series Scraper

For each series category:
- Fetch the category listing page
- Extract all coin entries (PCGS numbers + names)
- Handle pagination if the series has multiple pages
- Store basic coin info in `coin_references` table

### 2. Coin Detail Scraper

For each coin in a series:
- Fetch the individual coin detail page
- Extract:
  - PCGS Number (primary identifier)
  - Year
  - Mint Mark (P, D, S, W, CC, O, etc.)
  - Denomination ($1, 5C, $50, 1C, etc.)
  - Variety (Business Strike, Proof, Type 1, DDO, etc.)
  - Mintage figures
  - Full display name
- Also extract price guide table (prices by grade)

### 3. Price Guide Scraper

From each coin detail page, extract the price guide table:
- Grade (MS60, MS61, ..., MS70, PR60, ..., PR70, etc.)
- PCGS Price Guide value

Store in `coin_price_guide` table with today's date.

### 4. Search Token Generation

After scraping each coin, generate search tokens:
```python
def generate_search_tokens(coin: CoinReference) -> str:
    """Generate tsvector for full-text search"""
    parts = [
        str(coin.year),
        coin.mint_mark or '',
        coin.denomination,
        coin.series,
        coin.variety or '',
        coin.full_name,
    ]
    return ' '.join(filter(None, parts))
```

## Rate Limiting & Politeness

**Critical:** Be respectful of PCGS servers.

- Add 1-2 second delay between requests
- Use proper User-Agent header
- Implement exponential backoff on failures
- Cache responses locally to avoid re-fetching
- Run during off-peak hours (late night)

```python
import asyncio
import random

async def polite_request(client, url):
    """Make a request with rate limiting"""
    await asyncio.sleep(1 + random.random())  # 1-2 second delay
    
    headers = {
        'User-Agent': 'BullionTracker/1.0 (Personal Collection App)',
        'Accept': 'text/html,application/xhtml+xml',
    }
    
    response = await client.get(url, headers=headers, timeout=30.0)
    response.raise_for_status()
    return response.text
```

## Error Handling

- Log failed requests with URL and error
- Retry failed requests up to 3 times with exponential backoff
- Skip coins that fail after retries (don't block entire series)
- Generate summary report at end showing success/failure counts

## Seed Data: Valid Grades

Before scraping, seed the `valid_grades` table:

```python
VALID_GRADES = [
    # Poor to Fair
    ('PO01', 1, 'Poor', 1),
    ('FR02', 2, 'Fair', 2),
    # About Good
    ('AG03', 3, 'About Good', 3),
    # Good
    ('G04', 4, 'Good', 4),
    ('G06', 6, 'Good', 5),
    # Very Good
    ('VG08', 8, 'Very Good', 6),
    ('VG10', 10, 'Very Good', 7),
    # Fine
    ('F12', 12, 'Fine', 8),
    ('F15', 15, 'Fine', 9),
    # Very Fine
    ('VF20', 20, 'Very Fine', 10),
    ('VF25', 25, 'Very Fine', 11),
    ('VF30', 30, 'Very Fine', 12),
    ('VF35', 35, 'Very Fine', 13),
    # Extremely Fine
    ('EF40', 40, 'Extremely Fine', 14),
    ('EF45', 45, 'Extremely Fine', 15),
    # About Uncirculated
    ('AU50', 50, 'About Uncirculated', 16),
    ('AU53', 53, 'About Uncirculated', 17),
    ('AU55', 55, 'About Uncirculated', 18),
    ('AU58', 58, 'About Uncirculated', 19),
    # Mint State
    ('MS60', 60, 'Mint State', 20),
    ('MS61', 61, 'Mint State', 21),
    ('MS62', 62, 'Mint State', 22),
    ('MS63', 63, 'Mint State', 23),
    ('MS64', 64, 'Mint State', 24),
    ('MS65', 65, 'Mint State', 25),
    ('MS66', 66, 'Mint State', 26),
    ('MS67', 67, 'Mint State', 27),
    ('MS68', 68, 'Mint State', 28),
    ('MS69', 69, 'Mint State', 29),
    ('MS70', 70, 'Mint State', 30),
    # Proof
    ('PR60', 60, 'Proof', 31),
    ('PR61', 61, 'Proof', 32),
    ('PR62', 62, 'Proof', 33),
    ('PR63', 63, 'Proof', 34),
    ('PR64', 64, 'Proof', 35),
    ('PR65', 65, 'Proof', 36),
    ('PR66', 66, 'Proof', 37),
    ('PR67', 67, 'Proof', 38),
    ('PR68', 68, 'Proof', 39),
    ('PR69', 69, 'Proof', 40),
    ('PR70', 70, 'Proof', 41),
]
```

## File Structure

```
scrapers/
    __init__.py
    pcgs_scraper.py      # Main scraper logic
    models.py            # SQLAlchemy models
    seed_grades.py       # Seed valid_grades table
    config.py            # Database connection, settings

scripts/
    run_scraper.py       # CLI to run full scrape
    refresh_prices.py    # Weekly price refresh only
```

## CLI Interface

```bash
# Seed grades table
python scripts/seed_grades.py

# Scrape single series (for testing)
python scripts/run_scraper.py --series "silver-eagles" --category 833

# Scrape all P0 priority series
python scripts/run_scraper.py --priority P0

# Scrape all series
python scripts/run_scraper.py --all

# Refresh price guide only (weekly job)
python scripts/refresh_prices.py
```

## Expected Output

After running the full scraper:
- `coin_references` table: ~1,180 rows
- `coin_price_guide` table: ~1,180 × 20 grades = ~23,600 rows
- `valid_grades` table: 41 rows

## Weekly Refresh Job

Create a Celery task to refresh price guide data weekly:

```python
@celery.task
def refresh_price_guide():
    """Run every Sunday at 2 AM"""
    
    # Get all coin references
    coins = db.query(CoinReference).all()
    
    for coin in coins:
        # Fetch latest prices from PCGS
        prices = scrape_coin_prices(coin.pcgs_number)
        
        # Upsert price guide entries
        for grade, price in prices.items():
            upsert_price_guide(
                coin_reference_id=coin.id,
                grade_code=grade,
                pcgs_price=price,
                price_date=date.today()
            )
        
        await asyncio.sleep(1)  # Rate limit
    
    return f"Refreshed prices for {len(coins)} coins"
```

## Testing

Start with Silver Eagles (smallest series, ~80 coins) to validate:
1. Series listing page parsing works
2. Coin detail page parsing works
3. Price guide extraction works
4. Database inserts work
5. Search tokens are generated correctly

Then expand to other series.

## Deliverables

1. **SQLAlchemy models** for all 3 tables
2. **Scraper module** with async HTTP client
3. **CLI scripts** to run scraper and refresh prices
4. **Celery task** for weekly price refresh
5. **README** with setup and usage instructions

Please start by implementing the database models and seed script, then build the scraper for Silver Eagles as a proof of concept. Once that works, we can expand to other series.

---

## Full Implementation Code

### Project Structure

```
coin_scraper/
├── __init__.py
├── config.py
├── database.py
├── models/
│   ├── __init__.py
│   ├── coin_reference.py
│   ├── valid_grade.py
│   └── coin_price_guide.py
├── scrapers/
│   ├── __init__.py
│   ├── pcgs_scraper.py
│   └── cert_lookup.py
├── scripts/
│   ├── seed_grades.py
│   ├── run_scraper.py
│   └── refresh_prices.py
├── tasks/
│   ├── __init__.py
│   └── weekly_refresh.py
├── requirements.txt
└── README.md
```

### config.py

```python
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/bullion_tracker")

# PCGS CoinFacts base URLs
PCGS_COINFACTS_BASE = "https://www.pcgs.com/coinfacts"
PCGS_CATEGORY_URL = f"{PCGS_COINFACTS_BASE}/category"
PCGS_COIN_DETAIL_URL = f"{PCGS_COINFACTS_BASE}/coin/detail"

# Target series to scrape
COIN_SERIES = [
    {"name": "Silver Eagles", "slug": "silver-eagles", "category_id": 833, "priority": "P0"},
    {"name": "Gold Eagles", "slug": "gold-eagles", "category_id": 835, "priority": "P0"},
    {"name": "Morgan Dollars", "slug": "morgan-dollars", "category_id": 53, "priority": "P0"},
    {"name": "Lincoln Cents", "slug": "lincoln-cents-wheat-reverse", "category_id": 37, "priority": "P0"},
    {"name": "Jefferson Nickels", "slug": "jefferson-nickels", "category_id": 39, "priority": "P0"},
    {"name": "Peace Dollars", "slug": "peace-dollars", "category_id": 54, "priority": "P1"},
    {"name": "Barber Dimes", "slug": "barber-dimes", "category_id": 44, "priority": "P1"},
    {"name": "Barber Quarters", "slug": "barber-quarters", "category_id": 49, "priority": "P1"},
    {"name": "Barber Halves", "slug": "barber-half-dollars", "category_id": 52, "priority": "P1"},
    {"name": "Walking Liberty Halves", "slug": "walking-liberty-half-dollars", "category_id": 51, "priority": "P1"},
    {"name": "Franklin Halves", "slug": "franklin-half-dollars", "category_id": 50, "priority": "P1"},
]

# Rate limiting
REQUEST_DELAY_MIN = 1.0  # seconds
REQUEST_DELAY_MAX = 2.0  # seconds
MAX_RETRIES = 3
RETRY_BACKOFF = 2  # exponential backoff multiplier

# User agent
USER_AGENT = "BullionTracker/1.0 (Personal Collection App; contact@example.com)"
```

### database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
```

### models/coin_reference.py

```python
from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from sqlalchemy.dialects.postgresql import TSVECTOR
from database import Base

class CoinReference(Base):
    __tablename__ = 'coin_references'
    
    id = Column(Integer, primary_key=True)
    pcgs_number = Column(Integer, unique=True, nullable=False, index=True)
    ngc_number = Column(Integer)
    year = Column(Integer, nullable=False, index=True)
    mint_mark = Column(String(5))
    denomination = Column(String(50), nullable=False)
    series = Column(String(100), nullable=False, index=True)
    variety = Column(String(200))
    metal = Column(String(20))
    weight_oz = Column(Numeric(10, 4))
    fineness = Column(Numeric(5, 4))
    mintage = Column(Integer)
    full_name = Column(String(300), nullable=False)
    search_tokens = Column(TSVECTOR)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<CoinReference {self.pcgs_number}: {self.full_name}>"
    
    @staticmethod
    def generate_search_tokens(year, mint_mark, denomination, series, variety, full_name):
        """Generate text for tsvector search"""
        parts = [
            str(year),
            mint_mark or '',
            denomination or '',
            series or '',
            variety or '',
            full_name or '',
        ]
        return ' '.join(filter(None, parts))
```

### models/valid_grade.py

```python
from sqlalchemy import Column, Integer, String
from database import Base

class ValidGrade(Base):
    __tablename__ = 'valid_grades'
    
    id = Column(Integer, primary_key=True)
    grade_code = Column(String(10), unique=True, nullable=False)
    numeric_value = Column(Integer, nullable=False)
    grade_category = Column(String(30), nullable=False)
    display_order = Column(Integer, nullable=False)
    
    def __repr__(self):
        return f"<ValidGrade {self.grade_code}>"
```

### models/coin_price_guide.py

```python
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from database import Base

class CoinPriceGuide(Base):
    __tablename__ = 'coin_price_guide'
    
    id = Column(Integer, primary_key=True)
    coin_reference_id = Column(Integer, ForeignKey('coin_references.id', ondelete='CASCADE'), nullable=False)
    grade_code = Column(String(10), ForeignKey('valid_grades.grade_code'), nullable=False)
    pcgs_price = Column(Numeric(12, 2))
    price_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('coin_reference_id', 'grade_code', 'price_date', name='uq_price_guide'),
    )
    
    coin_reference = relationship("CoinReference")
    
    def __repr__(self):
        return f"<CoinPriceGuide {self.coin_reference_id} {self.grade_code}: ${self.pcgs_price}>"
```

### scrapers/pcgs_scraper.py

```python
import asyncio
import random
import re
import logging
from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict, Any

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

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
        # This is an approximation; you may need to inspect the actual HTML
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
        
        # Upsert coin reference
        stmt = insert(CoinReference).values(
            pcgs_number=coin_data['pcgs_number'],
            year=coin_data.get('year'),
            mint_mark=coin_data.get('mint_mark'),
            denomination=coin_data.get('denomination'),
            series=coin_data.get('series'),
            variety=coin_data.get('variety'),
            mintage=coin_data.get('mintage'),
            full_name=coin_data.get('full_name', f"PCGS# {coin_data['pcgs_number']}"),
        ).on_conflict_do_update(
            index_elements=['pcgs_number'],
            set_={
                'year': coin_data.get('year'),
                'mint_mark': coin_data.get('mint_mark'),
                'denomination': coin_data.get('denomination'),
                'variety': coin_data.get('variety'),
                'mintage': coin_data.get('mintage'),
                'full_name': coin_data.get('full_name'),
            }
        )
        
        self.db.execute(stmt)
        self.db.commit()
        
        # Get the coin reference ID
        coin_ref = self.db.query(CoinReference).filter(
            CoinReference.pcgs_number == coin_data['pcgs_number']
        ).first()
        
        # Update search tokens using raw SQL (tsvector)
        self.db.execute(
            f"""
            UPDATE coin_references 
            SET search_tokens = to_tsvector('english', :search_text)
            WHERE id = :id
            """,
            {'search_text': search_text, 'id': coin_ref.id}
        )
        
        # Save prices
        today = date.today()
        for grade, price in coin_data.get('prices', {}).items():
            stmt = insert(CoinPriceGuide).values(
                coin_reference_id=coin_ref.id,
                grade_code=grade,
                pcgs_price=price,
                price_date=today,
            ).on_conflict_do_update(
                constraint='uq_price_guide',
                set_={'pcgs_price': price}
            )
            self.db.execute(stmt)
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
```

### scripts/seed_grades.py

```python
#!/usr/bin/env python3
"""Seed the valid_grades table with all PCGS grades"""

import sys
sys.path.append('..')

from database import SessionLocal, init_db
from models.valid_grade import ValidGrade

VALID_GRADES = [
    ('PO01', 1, 'Poor', 1),
    ('FR02', 2, 'Fair', 2),
    ('AG03', 3, 'About Good', 3),
    ('G04', 4, 'Good', 4),
    ('G06', 6, 'Good', 5),
    ('VG08', 8, 'Very Good', 6),
    ('VG10', 10, 'Very Good', 7),
    ('F12', 12, 'Fine', 8),
    ('F15', 15, 'Fine', 9),
    ('VF20', 20, 'Very Fine', 10),
    ('VF25', 25, 'Very Fine', 11),
    ('VF30', 30, 'Very Fine', 12),
    ('VF35', 35, 'Very Fine', 13),
    ('EF40', 40, 'Extremely Fine', 14),
    ('EF45', 45, 'Extremely Fine', 15),
    ('AU50', 50, 'About Uncirculated', 16),
    ('AU53', 53, 'About Uncirculated', 17),
    ('AU55', 55, 'About Uncirculated', 18),
    ('AU58', 58, 'About Uncirculated', 19),
    ('MS60', 60, 'Mint State', 20),
    ('MS61', 61, 'Mint State', 21),
    ('MS62', 62, 'Mint State', 22),
    ('MS63', 63, 'Mint State', 23),
    ('MS64', 64, 'Mint State', 24),
    ('MS65', 65, 'Mint State', 25),
    ('MS66', 66, 'Mint State', 26),
    ('MS67', 67, 'Mint State', 27),
    ('MS68', 68, 'Mint State', 28),
    ('MS69', 69, 'Mint State', 29),
    ('MS70', 70, 'Mint State', 30),
    ('PR60', 60, 'Proof', 31),
    ('PR61', 61, 'Proof', 32),
    ('PR62', 62, 'Proof', 33),
    ('PR63', 63, 'Proof', 34),
    ('PR64', 64, 'Proof', 35),
    ('PR65', 65, 'Proof', 36),
    ('PR66', 66, 'Proof', 37),
    ('PR67', 67, 'Proof', 38),
    ('PR68', 68, 'Proof', 39),
    ('PR69', 69, 'Proof', 40),
    ('PR70', 70, 'Proof', 41),
]

def seed_grades():
    # Initialize database
    init_db()
    
    db = SessionLocal()
    
    try:
        # Clear existing grades
        db.query(ValidGrade).delete()
        
        # Insert grades
        for grade_code, numeric_value, category, display_order in VALID_GRADES:
            grade = ValidGrade(
                grade_code=grade_code,
                numeric_value=numeric_value,
                grade_category=category,
                display_order=display_order,
            )
            db.add(grade)
        
        db.commit()
        print(f"Seeded {len(VALID_GRADES)} grades")
        
    finally:
        db.close()

if __name__ == '__main__':
    seed_grades()
```

### scripts/run_scraper.py

```python
#!/usr/bin/env python3
"""CLI to run the PCGS scraper"""

import argparse
import asyncio
import sys
sys.path.append('..')

from database import SessionLocal, init_db
from scrapers.pcgs_scraper import run_scraper

def main():
    parser = argparse.ArgumentParser(description='Scrape PCGS CoinFacts')
    parser.add_argument('--series', type=str, help='Scrape specific series by slug')
    parser.add_argument('--priority', type=str, choices=['P0', 'P1'], help='Scrape by priority')
    parser.add_argument('--all', action='store_true', help='Scrape all series')
    
    args = parser.parse_args()
    
    if not (args.series or args.priority or args.all):
        print("Please specify --series, --priority, or --all")
        parser.print_help()
        sys.exit(1)
    
    # Initialize database
    init_db()
    
    db = SessionLocal()
    
    try:
        stats = asyncio.run(run_scraper(
            db,
            series_filter=args.series,
            priority_filter=args.priority if not args.all else None,
        ))
        
        print(f"\nScraping complete!")
        print(f"  Coins scraped: {stats['coins_scraped']}")
        print(f"  Coins failed: {stats['coins_failed']}")
        print(f"  Prices scraped: {stats['prices_scraped']}")
        
    finally:
        db.close()

if __name__ == '__main__':
    main()
```

### scripts/refresh_prices.py

```python
#!/usr/bin/env python3
"""Refresh price guide data for all coins"""

import asyncio
import sys
sys.path.append('..')

from database import SessionLocal, init_db
from models.coin_reference import CoinReference
from scrapers.pcgs_scraper import PCGSScraper

async def refresh_prices():
    init_db()
    db = SessionLocal()
    scraper = PCGSScraper(db)
    
    try:
        # Get all coins
        coins = db.query(CoinReference).all()
        print(f"Refreshing prices for {len(coins)} coins...")
        
        for coin in coins:
            detail = await scraper.scrape_coin_detail(coin.pcgs_number)
            if detail:
                await scraper._save_coin({
                    'pcgs_number': coin.pcgs_number,
                    'prices': detail.get('prices', {}),
                })
        
        print(f"Refreshed {scraper.stats['prices_scraped']} prices")
        
    finally:
        await scraper.close()
        db.close()

if __name__ == '__main__':
    asyncio.run(refresh_prices())
```

### tasks/weekly_refresh.py

```python
"""Celery task for weekly price refresh"""

from celery import Celery
import asyncio

from database import SessionLocal
from scrapers.pcgs_scraper import run_scraper

app = Celery('coin_scraper')
app.config_from_object('celeryconfig')

@app.task
def refresh_all_prices():
    """Run every Sunday at 2 AM"""
    db = SessionLocal()
    
    try:
        stats = asyncio.run(run_scraper(db))
        return f"Refreshed {stats['prices_scraped']} prices for {stats['coins_scraped']} coins"
    finally:
        db.close()

# Celery beat schedule
app.conf.beat_schedule = {
    'weekly-price-refresh': {
        'task': 'tasks.weekly_refresh.refresh_all_prices',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # Sunday 2 AM
    },
}
```

### requirements.txt

```
httpx>=0.24.0
beautifulsoup4>=4.12.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
celery>=5.3.0
redis>=4.5.0
```

### README.md

```markdown
# PCGS Coin Scraper

Scraper for populating coin reference database from PCGS CoinFacts.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables:
   ```bash
   export DATABASE_URL=postgresql://user:pass@localhost/bullion_tracker
   ```

3. Initialize database and seed grades:
   ```bash
   python scripts/seed_grades.py
   ```

## Usage

### Scrape specific series (for testing):
```bash
python scripts/run_scraper.py --series silver-eagles
```

### Scrape all P0 priority series:
```bash
python scripts/run_scraper.py --priority P0
```

### Scrape all series:
```bash
python scripts/run_scraper.py --all
```

### Refresh prices only:
```bash
python scripts/refresh_prices.py
```

## Weekly Refresh

Start Celery worker and beat:
```bash
celery -A tasks.weekly_refresh worker --beat
```

## Notes

- The scraper includes 1-2 second delays between requests
- Failed requests are retried up to 3 times with exponential backoff
- Run during off-peak hours to be respectful of PCGS servers
```
