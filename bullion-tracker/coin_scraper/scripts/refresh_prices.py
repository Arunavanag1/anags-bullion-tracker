#!/usr/bin/env python3
"""Refresh price guide data for all coins"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
            detail = await scraper.scrape_coin_detail(coin.pcgsNumber)
            if detail:
                await scraper._save_coin({
                    'pcgs_number': coin.pcgsNumber,
                    'year': coin.year,
                    'mint_mark': coin.mintMark,
                    'denomination': coin.denomination,
                    'series': coin.series,
                    'variety': coin.variety,
                    'full_name': coin.fullName,
                    'prices': detail.get('prices', {}),
                })

        print(f"✅ Refreshed {scraper.stats['prices_scraped']} prices")

    finally:
        await scraper.close()
        db.close()

if __name__ == '__main__':
    asyncio.run(refresh_prices())
