#!/usr/bin/env python3
"""
PCGS CoinFacts Scraper CLI

Usage:
    python run_scraper.py --priority P0                 # Scrape all P0 series
    python run_scraper.py --series silver-eagles        # Scrape single series
    python run_scraper.py --resume                      # Continue from last position
    python run_scraper.py --status                      # Show progress summary
    python run_scraper.py --verify --series silver-eagles  # Test selectors
    python run_scraper.py --priority P0 --dry-run --limit 5  # Dry run
"""

import argparse
import asyncio
import sys
import logging
from pathlib import Path

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import COIN_SERIES, DATABASE_URL
from scrapers.pcgs_scraper import PCGSScraper, run_scraper
from scrapers.progress_tracker import ProgressTracker

# Try to import tqdm for progress bar
try:
    from tqdm import tqdm
    from tqdm.asyncio import tqdm as atqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("Note: Install tqdm for progress bars: pip install tqdm")

# Database connection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_db_session():
    """Create a database session."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    return Session()


def show_status(tracker: ProgressTracker):
    """Show current progress status."""
    print("\n" + tracker.get_progress_summary())

    # Show per-priority breakdown
    print("\n--- Priority Breakdown ---")
    for priority in ['P0', 'P1', 'P2', 'P3']:
        pending = tracker.get_pending_series(priority)
        total = len([s for s in COIN_SERIES if s.get('priority') == priority])
        completed = total - len(pending)
        print(f"  {priority}: {completed}/{total} series complete")

    # Show failed coins summary
    failed = tracker.get_failed_coins()
    if failed:
        print(f"\nFailed coins available for retry: {len(failed)}")
        print("  Use --retry-failed to retry these")


def list_series():
    """List all configured series with status."""
    tracker = ProgressTracker()

    print("\n=== Configured Series ===\n")
    print(f"{'Priority':<8} {'Series':<35} {'Est.':<8} {'Status':<12}")
    print("-" * 65)

    for series in COIN_SERIES:
        priority = series.get('priority', '?')
        name = series['name'][:33]
        est = series.get('est_coins', '?')
        status_info = tracker.get_series_status(series['slug'])

        if status_info:
            if status_info['status'] == 'completed':
                status = f"Done ({status_info['coins_scraped']})"
            elif status_info['status'] == 'in_progress':
                status = f"In progress"
            else:
                status = status_info['status']
        else:
            status = "Pending"

        print(f"{priority:<8} {name:<35} {str(est):<8} {status:<12}")


async def verify_selectors(series_slug: str):
    """Test selectors on a sample page without database writes."""
    print(f"\n=== Selector Verification: {series_slug} ===\n")

    # Find series config
    series_config = next((s for s in COIN_SERIES if s['slug'] == series_slug), None)
    if not series_config:
        print(f"Error: Series '{series_slug}' not found")
        print(f"Available: {', '.join(s['slug'] for s in COIN_SERIES[:5])}...")
        return

    # Create scraper without DB (for verification only)
    class MockDB:
        def query(self, *args): return None
        def add(self, *args): pass
        def commit(self): pass
        def refresh(self, *args): pass

    scraper = PCGSScraper(db=MockDB())

    try:
        print(f"Fetching series page: {series_config['name']}")
        coins = await scraper.scrape_series(
            series_config['name'],
            series_config['slug'],
            series_config['category_id']
        )

        if coins:
            print(f"\nFound {len(coins)} coins\n")
            print("First 5 coins:")
            for coin in coins[:5]:
                print(f"  PCGS #{coin['pcgs_number']}: {coin.get('full_name', 'N/A')[:50]}")

            # Test detail page
            if coins:
                print(f"\nTesting detail page for first coin: {coins[0]['pcgs_number']}")
                detail = await scraper.scrape_coin_detail(coins[0]['pcgs_number'])
                if detail:
                    print(f"  Name: {detail.get('full_name', 'N/A')[:50]}")
                    print(f"  Denomination: {detail.get('denomination', 'N/A')}")
                    print(f"  Variety: {detail.get('variety', 'N/A')}")
                    print(f"  NGC Number: {detail.get('ngc_number', 'N/A')}")
                    print(f"  Prices found: {len(detail.get('prices', {}))}")
                else:
                    print("  Failed to get detail page")
        else:
            print("No coins found - selectors may need updating")

        print("\n" + scraper.get_stats_summary())

    finally:
        await scraper.close()


async def run_dry_run(series_filter: str = None, priority_filter: str = None, limit: int = 5):
    """Run scraper in dry-run mode (no database writes)."""
    print(f"\n=== DRY RUN MODE (limit: {limit}) ===\n")

    class MockDB:
        def query(self, *args): return None
        def add(self, *args): pass
        def commit(self): pass
        def refresh(self, *args): pass

    scraper = PCGSScraper(db=MockDB())
    coins_found = 0

    try:
        for series in COIN_SERIES:
            if series_filter and series['slug'] != series_filter:
                continue
            if priority_filter and series.get('priority') != priority_filter:
                continue

            print(f"\nScraping: {series['name']}")
            coins = await scraper.scrape_series(
                series['name'],
                series['slug'],
                series['category_id']
            )

            for coin in coins[:limit - coins_found]:
                print(f"  - PCGS #{coin['pcgs_number']}: {coin.get('full_name', 'N/A')[:40]}")
                coins_found += 1
                if coins_found >= limit:
                    break

            if coins_found >= limit:
                print(f"\nLimit of {limit} coins reached.")
                break

        print("\n" + scraper.get_stats_summary())

    finally:
        await scraper.close()


async def run_full_scrape(series_filter: str = None, priority_filter: str = None, resume: bool = False):
    """Run full scraping operation."""
    db = get_db_session()
    tracker = ProgressTracker()

    if resume:
        resume_point = tracker.get_resume_point()
        if resume_point:
            print(f"\nResuming from: {resume_point['series_slug']}")
            print(f"  Coins scraped so far: {resume_point['coins_scraped']}")
        else:
            pending = tracker.get_pending_series(priority_filter)
            if not pending:
                print("\nNo pending series to resume. All complete!")
                return
            print(f"\nNo incomplete series. Starting with {len(pending)} pending series.")

    # Get series to process
    series_list = []
    for series in COIN_SERIES:
        if series_filter and series['slug'] != series_filter:
            continue
        if priority_filter and series.get('priority') != priority_filter:
            continue
        if not tracker.is_series_complete(series['slug']):
            series_list.append(series)

    if not series_list:
        print("\nNo series to scrape (all complete or filtered out)")
        return

    total_est = sum(s.get('est_coins', 0) for s in series_list)
    print(f"\n=== Starting Scrape ===")
    print(f"Series: {len(series_list)}")
    print(f"Estimated coins: {total_est}")
    print()

    # Run with progress bar if available
    if HAS_TQDM:
        pbar = tqdm(series_list, desc="Series", unit="series")
        for series in pbar:
            pbar.set_description(f"Series: {series['name'][:20]}")
            scraper = PCGSScraper(db, progress_tracker=tracker)
            try:
                await scraper.scrape_and_save_series(
                    series['name'],
                    series['slug'],
                    series['category_id']
                )
            finally:
                await scraper.close()
            pbar.set_postfix(scraped=tracker.get_stats().coins_completed)
    else:
        for i, series in enumerate(series_list, 1):
            print(f"[{i}/{len(series_list)}] {series['name']}")
            scraper = PCGSScraper(db, progress_tracker=tracker)
            try:
                await scraper.scrape_and_save_series(
                    series['name'],
                    series['slug'],
                    series['category_id']
                )
            finally:
                await scraper.close()

    # Final stats
    print("\n" + tracker.get_progress_summary())


async def retry_failed():
    """Retry previously failed coins."""
    db = get_db_session()
    tracker = ProgressTracker()

    failed = tracker.get_failed_coins()
    if not failed:
        print("\nNo failed coins to retry.")
        return

    print(f"\n=== Retrying {len(failed)} Failed Coins ===\n")

    scraper = PCGSScraper(db, progress_tracker=tracker)
    try:
        for pcgs_num in failed:
            print(f"  Retrying: {pcgs_num}")
            detail = await scraper.scrape_coin_detail(pcgs_num)
            if detail:
                await scraper._save_coin(detail)
                tracker.mark_coin_complete(pcgs_num)
                print(f"    Success!")
            else:
                print(f"    Failed again")
    finally:
        await scraper.close()

    print("\n" + tracker.get_progress_summary())


def main():
    parser = argparse.ArgumentParser(
        description='PCGS CoinFacts Scraper',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_scraper.py --priority P0              Scrape all P0 (bullion) series
  python run_scraper.py --series silver-eagles     Scrape single series
  python run_scraper.py --resume                   Continue from last position
  python run_scraper.py --status                   Show progress summary
  python run_scraper.py --list                     List all series
  python run_scraper.py --verify --series X        Test selectors on series X
  python run_scraper.py --dry-run --limit 10       Dry run, 10 coins max
  python run_scraper.py --retry-failed             Retry previously failed coins
        """
    )

    # Filtering options
    parser.add_argument('--series', '-s', type=str, help='Scrape specific series (by slug)')
    parser.add_argument('--priority', '-p', type=str, choices=['P0', 'P1', 'P2', 'P3'],
                        help='Scrape by priority tier')

    # Operation modes
    parser.add_argument('--resume', '-r', action='store_true',
                        help='Resume from last position')
    parser.add_argument('--dry-run', action='store_true',
                        help='Run without database writes')
    parser.add_argument('--limit', type=int, default=5,
                        help='Limit coins in dry-run mode (default: 5)')

    # Verification and status
    parser.add_argument('--verify', '-v', action='store_true',
                        help='Test selectors on sample pages')
    parser.add_argument('--status', action='store_true',
                        help='Show current progress')
    parser.add_argument('--list', '-l', action='store_true',
                        help='List all configured series')
    parser.add_argument('--retry-failed', action='store_true',
                        help='Retry previously failed coins')

    # Logging
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Handle non-async operations
    if args.status:
        tracker = ProgressTracker()
        show_status(tracker)
        return

    if args.list:
        list_series()
        return

    # Handle async operations
    if args.verify:
        if not args.series:
            print("Error: --verify requires --series")
            sys.exit(1)
        asyncio.run(verify_selectors(args.series))
        return

    if args.dry_run:
        asyncio.run(run_dry_run(
            series_filter=args.series,
            priority_filter=args.priority,
            limit=args.limit
        ))
        return

    if args.retry_failed:
        asyncio.run(retry_failed())
        return

    # Default: full scrape
    if not args.series and not args.priority and not args.resume:
        print("Usage: python run_scraper.py --priority P0")
        print("       python run_scraper.py --series silver-eagles")
        print("       python run_scraper.py --resume")
        print("\nRun with --help for full options.")
        sys.exit(1)

    asyncio.run(run_full_scrape(
        series_filter=args.series,
        priority_filter=args.priority,
        resume=args.resume
    ))


if __name__ == '__main__':
    main()
