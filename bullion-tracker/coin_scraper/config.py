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
# Priority levels:
#   P0: Core modern bullion and key classics (scrape first) - ~500 coins
#   P1: Popular 20th century collector series - ~1,500 coins
#   P2: Complete 20th century coverage - ~2,500 coins
#   P3: Early US, gold, and commemoratives - ~3,500 coins
#
# Total estimated: ~8,000 coins

COIN_SERIES = [
    # ==================== P0: Core Modern & Key Classics (~500 coins) ====================
    # Modern Bullion
    {"name": "Silver Eagles", "slug": "silver-eagles", "category_id": 833, "priority": "P0", "est_coins": 45},
    {"name": "Gold Eagles", "slug": "gold-eagles", "category_id": 835, "priority": "P0", "est_coins": 160},
    {"name": "Platinum Eagles", "slug": "platinum-eagles", "category_id": 838, "priority": "P0", "est_coins": 120},
    {"name": "American Gold Buffalo", "slug": "gold-buffalo", "category_id": 836, "priority": "P0", "est_coins": 40},

    # Key Classic Silver Dollars
    {"name": "Morgan Dollars", "slug": "morgan-dollars", "category_id": 53, "priority": "P0", "est_coins": 150},
    {"name": "Peace Dollars", "slug": "peace-dollars", "category_id": 54, "priority": "P0", "est_coins": 30},

    # Popular 20th Century (High Demand)
    {"name": "Lincoln Cents Wheat Reverse", "slug": "lincoln-cents-wheat-reverse", "category_id": 37, "priority": "P0", "est_coins": 145},
    {"name": "Mercury Dimes", "slug": "mercury-dimes", "category_id": 45, "priority": "P0", "est_coins": 80},
    {"name": "Walking Liberty Halves", "slug": "walking-liberty-half-dollars", "category_id": 58, "priority": "P0", "est_coins": 65},

    # ==================== P1: Popular Collector Series (~1,500 coins) ====================
    # 20th Century Nickels
    {"name": "Jefferson Nickels", "slug": "jefferson-nickels", "category_id": 39, "priority": "P1", "est_coins": 250},
    {"name": "Buffalo Nickels", "slug": "buffalo-nickels", "category_id": 40, "priority": "P1", "est_coins": 75},

    # 20th Century Dimes & Quarters
    {"name": "Roosevelt Dimes", "slug": "roosevelt-dimes", "category_id": 44, "priority": "P1", "est_coins": 200},
    {"name": "Washington Quarters", "slug": "washington-quarters", "category_id": 49, "priority": "P1", "est_coins": 180},
    {"name": "Standing Liberty Quarters", "slug": "standing-liberty-quarters", "category_id": 50, "priority": "P1", "est_coins": 40},

    # 20th Century Half Dollars
    {"name": "Franklin Halves", "slug": "franklin-half-dollars", "category_id": 57, "priority": "P1", "est_coins": 35},
    {"name": "Kennedy Half Dollars", "slug": "kennedy-half-dollars", "category_id": 56, "priority": "P1", "est_coins": 140},

    # Modern Dollars
    {"name": "Eisenhower Dollars", "slug": "eisenhower-dollars", "category_id": 62, "priority": "P1", "est_coins": 35},
    {"name": "Susan B. Anthony Dollars", "slug": "susan-b-anthony-dollars", "category_id": 63, "priority": "P1", "est_coins": 18},
    {"name": "Sacagawea Dollars", "slug": "sacagawea-dollars", "category_id": 64, "priority": "P1", "est_coins": 55},
    {"name": "Presidential Dollars", "slug": "presidential-dollars", "category_id": 1041, "priority": "P1", "est_coins": 80},

    # State/Park Quarters (Popular Programs)
    {"name": "State Quarters", "slug": "state-quarters", "category_id": 850, "priority": "P1", "est_coins": 112},
    {"name": "America the Beautiful Quarters", "slug": "america-beautiful-quarters", "category_id": 1040, "priority": "P1", "est_coins": 120},

    # ==================== P2: Complete 20th Century (~2,500 coins) ====================
    # Barber Coinage
    {"name": "Barber Dimes", "slug": "barber-dimes", "category_id": 46, "priority": "P2", "est_coins": 75},
    {"name": "Barber Quarters", "slug": "barber-quarters", "category_id": 51, "priority": "P2", "est_coins": 75},
    {"name": "Barber Half Dollars", "slug": "barber-half-dollars", "category_id": 59, "priority": "P2", "est_coins": 75},

    # Earlier Cents
    {"name": "Indian Head Cents", "slug": "indian-head-cents", "category_id": 36, "priority": "P2", "est_coins": 70},
    {"name": "Flying Eagle Cents", "slug": "flying-eagle-cents", "category_id": 35, "priority": "P2", "est_coins": 8},
    {"name": "Lincoln Cents Memorial Reverse", "slug": "lincoln-cents-memorial", "category_id": 38, "priority": "P2", "est_coins": 200},
    {"name": "Lincoln Cents Shield Reverse", "slug": "lincoln-cents-shield", "category_id": 1038, "priority": "P2", "est_coins": 35},

    # Earlier Nickels
    {"name": "Liberty Nickels", "slug": "liberty-nickels", "category_id": 41, "priority": "P2", "est_coins": 40},
    {"name": "Shield Nickels", "slug": "shield-nickels", "category_id": 42, "priority": "P2", "est_coins": 30},

    # Seated Liberty (19th Century)
    {"name": "Seated Liberty Dimes", "slug": "seated-liberty-dimes", "category_id": 47, "priority": "P2", "est_coins": 150},
    {"name": "Seated Liberty Quarters", "slug": "seated-liberty-quarters", "category_id": 52, "priority": "P2", "est_coins": 140},
    {"name": "Seated Liberty Half Dollars", "slug": "seated-liberty-half-dollars", "category_id": 60, "priority": "P2", "est_coins": 150},
    {"name": "Seated Liberty Dollars", "slug": "seated-liberty-dollars", "category_id": 66, "priority": "P2", "est_coins": 45},

    # Trade Dollars
    {"name": "Trade Dollars", "slug": "trade-dollars", "category_id": 65, "priority": "P2", "est_coins": 20},

    # Modern Quarters Programs
    {"name": "American Women Quarters", "slug": "american-women-quarters", "category_id": 1050, "priority": "P2", "est_coins": 25},
    {"name": "American Innovation Dollars", "slug": "american-innovation-dollars", "category_id": 1052, "priority": "P2", "est_coins": 60},

    # Palladium Bullion
    {"name": "Palladium Eagles", "slug": "palladium-eagles", "category_id": 840, "priority": "P2", "est_coins": 12},

    # ==================== P3: Early US, Gold & Commemoratives (~3,500 coins) ====================
    # Early Cents
    {"name": "Large Cents", "slug": "large-cents", "category_id": 33, "priority": "P3", "est_coins": 200},
    {"name": "Half Cents", "slug": "half-cents", "category_id": 32, "priority": "P3", "est_coins": 80},

    # Bust Coinage
    {"name": "Bust Dimes", "slug": "bust-dimes", "category_id": 48, "priority": "P3", "est_coins": 50},
    {"name": "Bust Quarters", "slug": "bust-quarters", "category_id": 55, "priority": "P3", "est_coins": 45},
    {"name": "Bust Half Dollars", "slug": "bust-half-dollars", "category_id": 61, "priority": "P3", "est_coins": 180},
    {"name": "Bust Dollars", "slug": "bust-dollars", "category_id": 67, "priority": "P3", "est_coins": 25},

    # Obsolete Denominations
    {"name": "Three Cent Nickels", "slug": "three-cent-nickels", "category_id": 43, "priority": "P3", "est_coins": 25},
    {"name": "Three Cent Silver", "slug": "three-cent-silver", "category_id": 91, "priority": "P3", "est_coins": 35},
    {"name": "Two Cent Pieces", "slug": "two-cent-pieces", "category_id": 92, "priority": "P3", "est_coins": 15},
    {"name": "Twenty Cent Pieces", "slug": "twenty-cent-pieces", "category_id": 90, "priority": "P3", "est_coins": 10},
    {"name": "Half Dimes Seated", "slug": "half-dimes-seated", "category_id": 93, "priority": "P3", "est_coins": 80},
    {"name": "Half Dimes Early", "slug": "half-dimes-early", "category_id": 94, "priority": "P3", "est_coins": 40},

    # Pre-1933 Gold
    {"name": "Gold Dollars", "slug": "gold-dollars", "category_id": 70, "priority": "P3", "est_coins": 60},
    {"name": "$2.50 Liberty Quarter Eagles", "slug": "quarter-eagles-liberty", "category_id": 71, "priority": "P3", "est_coins": 100},
    {"name": "$2.50 Indian Quarter Eagles", "slug": "quarter-eagles-indian", "category_id": 72, "priority": "P3", "est_coins": 25},
    {"name": "$3 Gold Pieces", "slug": "three-dollar-gold", "category_id": 73, "priority": "P3", "est_coins": 45},
    {"name": "$5 Liberty Half Eagles", "slug": "half-eagles-liberty", "category_id": 74, "priority": "P3", "est_coins": 160},
    {"name": "$5 Indian Half Eagles", "slug": "half-eagles-indian", "category_id": 75, "priority": "P3", "est_coins": 25},
    {"name": "$10 Liberty Eagles", "slug": "eagles-liberty", "category_id": 76, "priority": "P3", "est_coins": 130},
    {"name": "$10 Indian Eagles", "slug": "eagles-indian", "category_id": 77, "priority": "P3", "est_coins": 35},
    {"name": "$20 Liberty Double Eagles", "slug": "double-eagles-liberty", "category_id": 78, "priority": "P3", "est_coins": 120},
    {"name": "$20 Saint-Gaudens Double Eagles", "slug": "double-eagles-saint-gaudens", "category_id": 79, "priority": "P3", "est_coins": 55},
    {"name": "Early Gold $2.50-$10", "slug": "early-gold", "category_id": 80, "priority": "P3", "est_coins": 150},

    # Commemoratives
    {"name": "Classic Commemoratives", "slug": "classic-commemoratives", "category_id": 100, "priority": "P3", "est_coins": 180},
    {"name": "Modern Commemoratives Silver", "slug": "modern-commemoratives-silver", "category_id": 101, "priority": "P3", "est_coins": 350},
    {"name": "Modern Commemoratives Gold", "slug": "modern-commemoratives-gold", "category_id": 102, "priority": "P3", "est_coins": 120},
    {"name": "Modern Commemoratives Clad", "slug": "modern-commemoratives-clad", "category_id": 103, "priority": "P3", "est_coins": 60},
    {"name": "First Spouse Gold", "slug": "first-spouse-gold", "category_id": 104, "priority": "P3", "est_coins": 45},
]

# Rate limiting
REQUEST_DELAY_MIN = 1.0  # seconds
REQUEST_DELAY_MAX = 2.0  # seconds
MAX_RETRIES = 3
RETRY_BACKOFF = 2  # exponential backoff multiplier

# User agent
USER_AGENT = "BullionTracker/1.0 (Personal Collection App)"
