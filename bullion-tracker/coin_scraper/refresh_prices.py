#!/usr/bin/env python3
"""
Price Refresh Script for Coin Reference Database

Uses PCGS API to update CoinPriceGuide entries, respecting daily quota limits.
Designed to be run via cron or manually.

Usage:
    python refresh_prices.py --status              # Show quota and last run stats
    python refresh_prices.py --dry-run             # Check what would be updated
    python refresh_prices.py --limit 50            # Update up to 50 coins
    python refresh_prices.py --priority P0         # Only update P0 priority coins
    python refresh_prices.py --report              # Show last 7 days activity

Environment:
    DATABASE_URL: PostgreSQL connection string
    PCGS_USERNAME: PCGS API credentials
    PCGS_PASSWORD: PCGS API credentials
"""

import argparse
import asyncio
import sys
import logging
import json
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import DATABASE_URL, COIN_SERIES
from api.pcgs_api import PCGSApiClient, PCGSApiError, QuotaExceededError
from api.quota_tracker import QuotaTracker

# Database
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Logging
logger = logging.getLogger(__name__)

# Paths
DATA_DIR = Path(__file__).parent / "data"
LOGS_DIR = Path(__file__).parent / "logs"
HISTORY_FILE = DATA_DIR / "price_refresh_history.json"

# Target grades to fetch prices for (most common collectible grades)
TARGET_GRADES = ["MS65", "MS66", "MS67", "PR70", "MS64", "AU58"]


class PriceRefresher:
    """Refreshes coin prices from PCGS API with quota management."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.quota_tracker = QuotaTracker()
        self.start_time = datetime.now()

        # Stats
        self.coins_updated = 0
        self.coins_skipped = 0
        self.coins_failed = 0
        self.api_calls_made = 0
        self.errors: List[str] = []

        # Setup logging
        self._setup_logging()

    def _setup_logging(self):
        """Setup logging to console and file."""
        LOGS_DIR.mkdir(exist_ok=True)
        DATA_DIR.mkdir(exist_ok=True)

        log_filename = f"price_refresh_{datetime.now().strftime('%Y-%m-%d')}.log"
        log_path = LOGS_DIR / log_filename

        # Configure logger
        self.logger = logging.getLogger("price_refresh")
        self.logger.setLevel(logging.INFO)
        self.logger.handlers = []

        # Console handler
        console = logging.StreamHandler()
        console.setLevel(logging.INFO)
        console.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s',
                                               datefmt='%H:%M:%S'))
        self.logger.addHandler(console)

        # File handler
        file_handler = logging.FileHandler(log_path)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(file_handler)

        self.log_path = log_path

    def get_db_engine(self):
        """Create database engine."""
        return create_engine(DATABASE_URL)

    def calculate_daily_budget(self) -> int:
        """Calculate how many API calls we can make today.

        Strategy: Spread 1,000 calls evenly over the week, saving some buffer.
        """
        remaining = self.quota_tracker.get_remaining()

        # If we're at less than 100 remaining, be conservative
        if remaining < 100:
            return min(remaining, 20)

        # Calculate daily budget: remaining / days_left_in_week
        today = date.today()
        days_until_reset = 7 - today.weekday()  # Days until Monday
        if days_until_reset == 0:
            days_until_reset = 7

        # Reserve 10% buffer
        usable = int(remaining * 0.9)
        daily_budget = max(usable // days_until_reset, 50)  # At least 50/day

        return min(daily_budget, remaining)

    def get_coins_needing_update(self, engine, limit: int, priority: Optional[str] = None) -> List[Dict]:
        """Get coins that need price updates.

        Order by:
        1. Priority tier (P0, P1, P2, P3)
        2. Last update date (oldest first)
        3. No price guide entry at all
        """
        # Build priority filter
        priority_filter = ""
        if priority:
            series_names = [s['name'] for s in COIN_SERIES if s.get('priority') == priority]
            if series_names:
                series_list = ", ".join([f"'{name}'" for name in series_names])
                priority_filter = f'AND cr.series IN ({series_list})'

        query = text(f"""
            WITH priority_order AS (
                SELECT
                    cr.id as coin_id,
                    cr."pcgsNumber",
                    cr."fullName",
                    cr.series,
                    CASE
                        WHEN cr.series IN (SELECT unnest(array['Silver Eagles', 'Gold Eagles', 'Platinum Eagles',
                            'American Gold Buffalo', 'Morgan Dollars', 'Peace Dollars',
                            'Lincoln Cents Wheat Reverse', 'Mercury Dimes', 'Walking Liberty Halves']))
                        THEN 0
                        WHEN cr.series LIKE 'Jefferson%' OR cr.series LIKE 'Buffalo%' OR
                             cr.series LIKE 'Roosevelt%' OR cr.series LIKE 'Washington%'
                        THEN 1
                        WHEN cr.series LIKE 'Barber%' OR cr.series LIKE 'Indian%' OR
                             cr.series LIKE 'Lincoln%' OR cr.series LIKE 'Seated%'
                        THEN 2
                        ELSE 3
                    END as priority_tier,
                    MAX(cpg."priceDate") as last_update
                FROM "CoinReference" cr
                LEFT JOIN "CoinPriceGuide" cpg ON cr.id = cpg."coinReferenceId"
                WHERE 1=1 {priority_filter}
                GROUP BY cr.id, cr."pcgsNumber", cr."fullName", cr.series
                HAVING MAX(cpg."priceDate") IS NULL
                    OR MAX(cpg."priceDate") < CURRENT_DATE - INTERVAL '7 days'
            )
            SELECT coin_id, "pcgsNumber", "fullName", series, priority_tier, last_update
            FROM priority_order
            ORDER BY priority_tier ASC, last_update ASC NULLS FIRST
            LIMIT :limit
        """)

        with engine.connect() as conn:
            result = conn.execute(query, {"limit": limit})
            coins = []
            for row in result:
                coins.append({
                    "coin_id": row[0],
                    "pcgs_number": row[1],
                    "full_name": row[2],
                    "series": row[3],
                    "priority_tier": row[4],
                    "last_update": row[5]
                })
        return coins

    async def fetch_price_from_api(self, client: PCGSApiClient, pcgs_number: int, grade: str) -> Optional[Dict]:
        """Fetch price data from PCGS API for a specific grade."""
        try:
            data = await client.get_coin_by_pcgs_and_grade(pcgs_number, grade)
            self.api_calls_made += 1

            if data and isinstance(data, dict):
                # Extract price from response
                price = data.get('PriceGuideValue') or data.get('Price') or data.get('Value')
                if price:
                    return {
                        "grade": grade,
                        "price": Decimal(str(price)),
                        "source": "pcgs"
                    }
            return None

        except QuotaExceededError:
            self.logger.warning(f"Quota exceeded while fetching PCGS#{pcgs_number}")
            raise
        except PCGSApiError as e:
            self.logger.debug(f"API error for PCGS#{pcgs_number} {grade}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error fetching PCGS#{pcgs_number} {grade}: {e}")
            return None

    def upsert_price_guide(self, engine, coin_id: str, grade: str, price: Decimal, source: str):
        """Insert or update CoinPriceGuide entry."""
        today = date.today()

        with engine.connect() as conn:
            # Check if entry exists for today
            check = conn.execute(text("""
                SELECT id FROM "CoinPriceGuide"
                WHERE "coinReferenceId" = :coin_id
                AND "gradeCode" = :grade
                AND "priceDate" = :today
            """), {"coin_id": coin_id, "grade": grade, "today": today})

            existing = check.fetchone()

            if existing:
                # Update existing
                conn.execute(text("""
                    UPDATE "CoinPriceGuide"
                    SET "pcgsPrice" = :price, "priceSource" = :source
                    WHERE id = :id
                """), {"price": price, "source": source, "id": existing[0]})
            else:
                # Insert new - need to generate cuid-like id
                import uuid
                new_id = str(uuid.uuid4()).replace('-', '')[:25]

                conn.execute(text("""
                    INSERT INTO "CoinPriceGuide"
                    (id, "coinReferenceId", "gradeCode", "pcgsPrice", "priceSource", "priceDate", "createdAt")
                    VALUES (:id, :coin_id, :grade, :price, :source, :today, NOW())
                """), {
                    "id": new_id,
                    "coin_id": coin_id,
                    "grade": grade,
                    "price": price,
                    "source": source,
                    "today": today
                })

            conn.commit()

    async def refresh_coin_prices(self, engine, coin: Dict, client: PCGSApiClient) -> Tuple[int, int]:
        """Refresh prices for a single coin across target grades.

        Returns: (updated_count, failed_count)
        """
        updated = 0
        failed = 0

        self.logger.info(f"  Refreshing PCGS#{coin['pcgs_number']}: {coin['full_name'][:50]}")

        for grade in TARGET_GRADES:
            if not self.quota_tracker.check_quota():
                self.logger.warning("Quota exhausted, stopping")
                break

            price_data = await self.fetch_price_from_api(client, coin['pcgs_number'], grade)

            if price_data:
                if not self.dry_run:
                    self.upsert_price_guide(
                        engine,
                        coin['coin_id'],
                        price_data['grade'],
                        price_data['price'],
                        price_data['source']
                    )
                updated += 1
                self.logger.debug(f"    {grade}: ${price_data['price']}")
            else:
                failed += 1

            # Small delay between API calls
            await asyncio.sleep(0.5)

        return updated, failed

    async def run(self, limit: Optional[int] = None, priority: Optional[str] = None):
        """Run the price refresh process."""
        engine = self.get_db_engine()

        # Calculate budget
        budget = limit or self.calculate_daily_budget()
        self.logger.info("=" * 60)
        self.logger.info("        PRICE REFRESH STARTING")
        self.logger.info("=" * 60)
        self.logger.info(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        self.logger.info(f"API Budget: {budget} coins")
        self.logger.info(f"Quota remaining: {self.quota_tracker.get_remaining()}")
        if priority:
            self.logger.info(f"Priority filter: {priority}")
        self.logger.info("")

        # Get coins needing update
        coins = self.get_coins_needing_update(engine, budget, priority)

        if not coins:
            self.logger.info("No coins need updating.")
            return

        self.logger.info(f"Found {len(coins)} coins needing price updates")

        # Process coins
        async with PCGSApiClient(quota_tracker=self.quota_tracker) as client:
            try:
                await client.authenticate()

                for i, coin in enumerate(coins):
                    if not self.quota_tracker.check_quota():
                        self.logger.warning("Quota exhausted, stopping early")
                        break

                    self.logger.info(f"\n[{i+1}/{len(coins)}] Processing...")

                    try:
                        updated, failed = await self.refresh_coin_prices(engine, coin, client)
                        self.coins_updated += updated
                        self.coins_failed += failed

                        if updated > 0:
                            self.logger.info(f"    Updated {updated} grades")
                        else:
                            self.coins_skipped += 1

                    except QuotaExceededError:
                        self.logger.error("Quota exceeded, stopping")
                        break
                    except Exception as e:
                        self.logger.error(f"Error processing coin: {e}")
                        self.errors.append(f"PCGS#{coin['pcgs_number']}: {str(e)}")
                        self.coins_failed += 1

            except Exception as e:
                self.logger.error(f"Fatal error: {e}")
                self.errors.append(str(e))

        # Generate report
        self._generate_report()
        self._save_history()

    def _generate_report(self):
        """Generate end-of-run report."""
        elapsed = datetime.now() - self.start_time
        elapsed_str = str(elapsed).split('.')[0]

        quota_status = self.quota_tracker.get_status()

        report = [
            "",
            "=" * 60,
            "        PRICE REFRESH COMPLETE",
            "=" * 60,
            "",
            f"Duration: {elapsed_str}",
            f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}",
            "",
            "--- Results ---",
            f"Price updates: {self.coins_updated}",
            f"Coins skipped: {self.coins_skipped}",
            f"Failures: {self.coins_failed}",
            f"API calls made: {self.api_calls_made}",
            "",
            "--- Quota ---",
            f"Calls today: {quota_status['calls_made']}/{quota_status['daily_limit']}",
            f"Remaining: {quota_status['calls_remaining']}",
            "",
            f"Log file: {self.log_path}",
            "=" * 60,
        ]

        if self.errors:
            report.extend(["", "--- Errors ---"] + self.errors[:10])
            if len(self.errors) > 10:
                report.append(f"... and {len(self.errors) - 10} more")

        for line in report:
            self.logger.info(line)

        # Write summary markdown
        self._write_summary_markdown(report)

    def _write_summary_markdown(self, report: List[str]):
        """Write latest.md summary file."""
        md_path = LOGS_DIR / "price_refresh_latest.md"

        content = [
            "# Price Refresh Summary",
            "",
            f"**Last Run:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "```",
        ] + report + [
            "```",
        ]

        md_path.write_text("\n".join(content))

    def _save_history(self):
        """Save run to history file."""
        history = self._load_history()

        run_record = {
            "timestamp": datetime.now().isoformat(),
            "coins_updated": self.coins_updated,
            "coins_skipped": self.coins_skipped,
            "coins_failed": self.coins_failed,
            "api_calls": self.api_calls_made,
            "dry_run": self.dry_run,
            "errors_count": len(self.errors)
        }

        history["runs"].append(run_record)

        # Keep only last 30 runs
        history["runs"] = history["runs"][-30:]
        history["last_run"] = run_record["timestamp"]

        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)

    def _load_history(self) -> Dict:
        """Load run history from file."""
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return {"runs": [], "last_run": None}


def show_status():
    """Show current quota and run status."""
    tracker = QuotaTracker()
    status = tracker.get_status()

    print("\n" + "=" * 50)
    print("        PRICE REFRESH STATUS")
    print("=" * 50)

    print("\n--- API Quota ---")
    print(f"Date: {status['date']}")
    print(f"Calls today: {status['calls_made']}/{status['daily_limit']}")
    print(f"Remaining: {status['calls_remaining']}")
    if status['last_call_at']:
        print(f"Last call: {status['last_call_at']}")

    # Load history
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)

        if history.get('runs'):
            last_run = history['runs'][-1]
            print("\n--- Last Run ---")
            print(f"Time: {last_run['timestamp']}")
            print(f"Coins updated: {last_run['coins_updated']}")
            print(f"API calls: {last_run['api_calls']}")
            print(f"Mode: {'DRY RUN' if last_run.get('dry_run') else 'LIVE'}")

    print("=" * 50 + "\n")


def show_report():
    """Show last 7 days of activity."""
    print("\n" + "=" * 60)
    print("        PRICE REFRESH ACTIVITY REPORT")
    print("=" * 60)

    if not HISTORY_FILE.exists():
        print("\nNo history found. Run some price refreshes first.")
        return

    with open(HISTORY_FILE, 'r') as f:
        history = json.load(f)

    runs = history.get('runs', [])
    if not runs:
        print("\nNo runs recorded yet.")
        return

    # Filter to last 7 days
    week_ago = datetime.now() - timedelta(days=7)
    recent_runs = [
        r for r in runs
        if datetime.fromisoformat(r['timestamp']) > week_ago
    ]

    print(f"\n--- Last 7 Days ({len(recent_runs)} runs) ---")
    print(f"{'Date':<12} {'Updated':<10} {'Failed':<10} {'API Calls':<10}")
    print("-" * 45)

    total_updated = 0
    total_failed = 0
    total_calls = 0

    for run in recent_runs:
        ts = datetime.fromisoformat(run['timestamp'])
        print(f"{ts.strftime('%Y-%m-%d'):<12} {run['coins_updated']:<10} {run['coins_failed']:<10} {run['api_calls']:<10}")
        total_updated += run['coins_updated']
        total_failed += run['coins_failed']
        total_calls += run['api_calls']

    print("-" * 45)
    print(f"{'TOTAL':<12} {total_updated:<10} {total_failed:<10} {total_calls:<10}")

    # Estimate time to full refresh
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT COUNT(*) FROM "CoinReference"'))
        total_coins = result.scalar() or 0

    if total_coins > 0 and len(recent_runs) > 0:
        avg_per_day = total_updated / max(len(recent_runs), 1)
        if avg_per_day > 0:
            days_to_complete = total_coins / avg_per_day
            print(f"\n--- Estimates ---")
            print(f"Total coins in database: {total_coins}")
            print(f"Average updates per day: {avg_per_day:.1f}")
            print(f"Days to complete full refresh: {days_to_complete:.0f}")

    # Check for stale coins
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(DISTINCT cr.id)
            FROM "CoinReference" cr
            LEFT JOIN "CoinPriceGuide" cpg ON cr.id = cpg."coinReferenceId"
            GROUP BY cr.id
            HAVING MAX(cpg."priceDate") IS NULL
                OR MAX(cpg."priceDate") < CURRENT_DATE - INTERVAL '14 days'
        """))
        stale_count = len(list(result))

    print(f"\nCoins with stale/no prices (>14 days): {stale_count}")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='Price Refresh Script - Update coin prices from PCGS API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python refresh_prices.py --status           Show quota and last run
  python refresh_prices.py --dry-run          See what would be updated
  python refresh_prices.py                    Run with calculated budget
  python refresh_prices.py --limit 100        Update up to 100 coins
  python refresh_prices.py --priority P0      Only P0 priority coins
  python refresh_prices.py --report           Show 7-day activity report
        """
    )

    parser.add_argument('--status', action='store_true',
                        help='Show quota status and last run')
    parser.add_argument('--report', action='store_true',
                        help='Show last 7 days activity report')
    parser.add_argument('--dry-run', action='store_true',
                        help='Check what would be updated without API calls')
    parser.add_argument('--limit', type=int,
                        help='Maximum coins to update (overrides calculated budget)')
    parser.add_argument('--priority', type=str, choices=['P0', 'P1', 'P2', 'P3'],
                        help='Only update coins in specific priority tier')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.status:
        show_status()
        return

    if args.report:
        show_report()
        return

    # Run refresh
    refresher = PriceRefresher(dry_run=args.dry_run)
    asyncio.run(refresher.run(limit=args.limit, priority=args.priority))


if __name__ == '__main__':
    main()
