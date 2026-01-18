#!/usr/bin/env python3
"""
Population Orchestration Script for Coin Reference Database

Runs scraping by priority tier with monitoring, logging, and reporting.

Usage:
    python populate.py --priority P0              # Run P0 tier (~835 coins)
    python populate.py --priority P0 --dry-run   # Dry run without DB writes
    python populate.py --priority P0 --limit 10  # Limit coins in dry run
    python populate.py --status                  # Show database counts
    python populate.py --report                  # Full progress report
"""

import argparse
import asyncio
import sys
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import COIN_SERIES, DATABASE_URL
from scrapers.pcgs_scraper import PCGSScraper
from scrapers.progress_tracker import ProgressTracker

# Database
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Try to import tqdm for progress bar
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False


class PopulationRunner:
    """Orchestrates coin database population with monitoring."""

    def __init__(self, dry_run: bool = False, log_dir: Optional[Path] = None):
        self.dry_run = dry_run
        self.log_dir = log_dir or Path(__file__).parent / "logs"
        self.log_dir.mkdir(exist_ok=True)

        # Setup logging to both console and file
        self._setup_logging()

        # Initialize trackers
        self.tracker = ProgressTracker()
        self.start_time = datetime.now()
        self.initial_counts: Dict[str, int] = {}
        self.final_counts: Dict[str, int] = {}

        # Run stats
        self.coins_scraped = 0
        self.coins_failed = 0
        self.series_completed = 0

    def _setup_logging(self):
        """Setup dual logging to console and file."""
        log_filename = f"population_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.log"
        log_path = self.log_dir / log_filename

        # Configure root logger
        self.logger = logging.getLogger("populate")
        self.logger.setLevel(logging.INFO)

        # Clear existing handlers
        self.logger.handlers = []

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_fmt = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s',
                                        datefmt='%H:%M:%S')
        console_handler.setFormatter(console_fmt)
        self.logger.addHandler(console_handler)

        # File handler
        file_handler = logging.FileHandler(log_path)
        file_handler.setLevel(logging.DEBUG)
        file_fmt = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_fmt)
        self.logger.addHandler(file_handler)

        self.log_path = log_path
        self.logger.info(f"Logging to: {log_path}")

    def get_db_session(self):
        """Create a database session."""
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        return Session()

    def get_db_counts(self) -> Dict[str, int]:
        """Get coin counts by series from database."""
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT series, COUNT(*) as count
                FROM "CoinReference"
                GROUP BY series
                ORDER BY series
            """))
            counts = {row[0]: row[1] for row in result}

            # Get total
            total_result = conn.execute(text('SELECT COUNT(*) FROM "CoinReference"'))
            counts['__total__'] = total_result.scalar() or 0

        return counts

    def get_series_for_priority(self, priority: str) -> List[Dict]:
        """Get series configs for a priority tier."""
        return [s for s in COIN_SERIES if s.get('priority') == priority]

    def show_status(self):
        """Show current database status."""
        counts = self.get_db_counts()
        total = counts.pop('__total__', 0)

        print("\n" + "=" * 60)
        print("           COIN REFERENCE DATABASE STATUS")
        print("=" * 60)
        print(f"\nTotal coins in database: {total:,}")
        print("\nCoins by series:")
        print("-" * 40)

        for series, count in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"  {series[:30]:<32} {count:>5}")

        # Priority breakdown
        print("\n" + "-" * 40)
        print("Coins by priority tier:")
        for priority in ['P0', 'P1', 'P2', 'P3']:
            series_list = self.get_series_for_priority(priority)
            tier_count = sum(counts.get(s['name'], 0) for s in series_list)
            est_total = sum(s.get('est_coins', 0) for s in series_list)
            print(f"  {priority}: {tier_count:,} / ~{est_total:,} estimated")

        print("=" * 60 + "\n")

    def show_progress_report(self):
        """Show full progress report."""
        self.show_status()
        print(self.tracker.get_progress_summary())

        # Show per-priority breakdown
        print("\n--- Priority Breakdown ---")
        for priority in ['P0', 'P1', 'P2', 'P3']:
            pending = self.tracker.get_pending_series(priority)
            total = len(self.get_series_for_priority(priority))
            completed = total - len(pending)
            print(f"  {priority}: {completed}/{total} series complete")

        # Show failed coins
        failed = self.tracker.get_failed_coins()
        if failed:
            print(f"\nFailed coins available for retry: {len(failed)}")

    async def run_population(self, priority: str, limit: Optional[int] = None):
        """Run population for a priority tier."""
        series_list = self.get_series_for_priority(priority)
        if not series_list:
            self.logger.error(f"No series found for priority {priority}")
            return

        # Filter to pending series only
        pending_series = [
            s for s in series_list
            if not self.tracker.is_series_complete(s['slug'])
        ]

        if not pending_series:
            self.logger.info(f"All {priority} series already complete!")
            return

        # Calculate estimates
        est_coins = sum(s.get('est_coins', 0) for s in pending_series)

        self.logger.info("=" * 60)
        self.logger.info(f"  STARTING {priority} POPULATION RUN")
        self.logger.info("=" * 60)
        self.logger.info(f"Series to scrape: {len(pending_series)}")
        self.logger.info(f"Estimated coins: ~{est_coins:,}")
        if self.dry_run:
            self.logger.info(f"DRY RUN MODE - no database writes")
            if limit:
                self.logger.info(f"Limit: {limit} coins per series")
        self.logger.info("")

        # Get initial counts
        self.initial_counts = self.get_db_counts()
        self.logger.info(f"Initial database count: {self.initial_counts.get('__total__', 0):,} coins")

        # Start run tracking
        run_id = self.tracker.start_run(priority_filter=priority)

        # Create database session (or mock for dry run)
        if self.dry_run:
            db = MockDB()
        else:
            db = self.get_db_session()

        try:
            # Process each series
            if HAS_TQDM and not self.dry_run:
                series_iter = tqdm(pending_series, desc="Series", unit="series")
            else:
                series_iter = pending_series

            for i, series in enumerate(series_iter):
                if HAS_TQDM and not self.dry_run:
                    series_iter.set_description(f"{series['name'][:25]}")

                self.logger.info(f"\n[{i+1}/{len(pending_series)}] {series['name']}")

                scraper = PCGSScraper(db, progress_tracker=self.tracker)
                try:
                    if self.dry_run:
                        await self._dry_run_series(scraper, series, limit)
                    else:
                        await scraper.scrape_and_save_series(
                            series['name'],
                            series['slug'],
                            series['category_id']
                        )
                        self.coins_scraped += scraper.stats['coins_scraped']
                        self.coins_failed += scraper.stats['coins_failed']

                    self.series_completed += 1

                except Exception as e:
                    self.logger.error(f"Error in series {series['name']}: {e}")
                finally:
                    await scraper.close()

                # Log progress periodically
                if (i + 1) % 3 == 0:
                    self.logger.info(f"Progress: {self.coins_scraped} scraped, {self.coins_failed} failed")

        finally:
            # Complete run tracking
            self.tracker.complete_run(run_id, self.coins_scraped, self.coins_failed)

            if not self.dry_run:
                db.close()

        # Generate end-of-run report
        self._generate_report(priority)

    async def _dry_run_series(self, scraper: PCGSScraper, series: Dict, limit: Optional[int]):
        """Run series in dry-run mode."""
        self.logger.info(f"  Fetching series page...")
        coins = await scraper.scrape_series(
            series['name'],
            series['slug'],
            series['category_id']
        )

        if not coins:
            self.logger.warning(f"  No coins found for {series['name']}")
            return

        display_count = min(len(coins), limit or 5)
        self.logger.info(f"  Found {len(coins)} coins, showing {display_count}:")

        for coin in coins[:display_count]:
            self.logger.info(f"    PCGS #{coin['pcgs_number']}: {coin.get('full_name', 'N/A')[:50]}")

        self.coins_scraped += len(coins)

    def _generate_report(self, priority: str):
        """Generate end-of-run report."""
        elapsed = datetime.now() - self.start_time
        elapsed_str = str(elapsed).split('.')[0]

        # Get final counts
        if not self.dry_run:
            self.final_counts = self.get_db_counts()
        else:
            self.final_counts = self.initial_counts.copy()

        initial_total = self.initial_counts.get('__total__', 0)
        final_total = self.final_counts.get('__total__', 0)
        new_coins = final_total - initial_total

        success_rate = (self.coins_scraped / (self.coins_scraped + self.coins_failed) * 100) \
            if (self.coins_scraped + self.coins_failed) > 0 else 0

        # Build report
        report = [
            "",
            "=" * 60,
            f"        {priority} POPULATION RUN COMPLETE",
            "=" * 60,
            "",
            f"Duration: {elapsed_str}",
            f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}",
            "",
            "--- Results ---",
            f"Series processed: {self.series_completed}",
            f"Coins scraped: {self.coins_scraped:,}",
            f"Coins failed: {self.coins_failed:,}",
            f"Success rate: {success_rate:.1f}%",
            "",
            "--- Database ---",
            f"Initial count: {initial_total:,}",
            f"Final count: {final_total:,}",
            f"New coins added: {new_coins:,}",
            "",
            f"Log file: {self.log_path}",
            "=" * 60,
        ]

        for line in report:
            self.logger.info(line)

        # Also print to console
        print("\n".join(report))


class MockDB:
    """Mock database for dry-run mode."""
    def query(self, *args):
        class MockQuery:
            def filter(self, *args):
                return self
            def first(self):
                return None
        return MockQuery()

    def add(self, *args):
        pass

    def commit(self):
        pass

    def refresh(self, *args):
        pass

    def close(self):
        pass


def main():
    parser = argparse.ArgumentParser(
        description='Coin Database Population Runner',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python populate.py --priority P0                Run P0 tier (~835 bullion coins)
  python populate.py --priority P0 --dry-run      Dry run (no DB writes)
  python populate.py --priority P0 --limit 3      Dry run with 3 coins per series
  python populate.py --status                     Show database status
  python populate.py --report                     Full progress report
        """
    )

    parser.add_argument('--priority', '-p', type=str, choices=['P0', 'P1', 'P2', 'P3'],
                        help='Priority tier to populate')
    parser.add_argument('--dry-run', action='store_true',
                        help='Run without database writes')
    parser.add_argument('--limit', type=int, default=None,
                        help='Limit coins per series in dry-run mode')
    parser.add_argument('--status', action='store_true',
                        help='Show database status')
    parser.add_argument('--report', action='store_true',
                        help='Show full progress report')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')

    args = parser.parse_args()

    # Handle status/report commands
    if args.status:
        runner = PopulationRunner()
        runner.show_status()
        return

    if args.report:
        runner = PopulationRunner()
        runner.show_progress_report()
        return

    # Require priority for population run
    if not args.priority:
        print("Usage: python populate.py --priority P0")
        print("       python populate.py --status")
        print("\nRun with --help for full options.")
        sys.exit(1)

    # Enable debug if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Run population
    runner = PopulationRunner(dry_run=args.dry_run)
    asyncio.run(runner.run_population(args.priority, limit=args.limit))


if __name__ == '__main__':
    main()
