#!/usr/bin/env python3
"""CLI to run the PCGS scraper"""

import argparse
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, init_db
from scrapers.pcgs_scraper import run_scraper

def main():
    parser = argparse.ArgumentParser(description='Scrape PCGS CoinFacts')
    parser.add_argument('--series', type=str, help='Scrape specific series by slug (e.g., silver-eagles)')
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

        print(f"\n✅ Scraping complete!")
        print(f"  Coins scraped: {stats['coins_scraped']}")
        print(f"  Coins failed: {stats['coins_failed']}")
        print(f"  Prices scraped: {stats['prices_scraped']}")

    finally:
        db.close()

if __name__ == '__main__':
    main()
