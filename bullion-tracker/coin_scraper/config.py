import os
from dotenv import load_dotenv

load_dotenv()

# Get DATABASE_URL and remove Prisma-specific ?schema parameter
raw_url = os.getenv("DATABASE_URL", "postgresql://arunavanag@localhost:5432/bullion_tracker")
DATABASE_URL = raw_url.split('?')[0]  # Remove query parameters like ?schema=public

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
USER_AGENT = "BullionTracker/1.0 (Personal Collection App)"
