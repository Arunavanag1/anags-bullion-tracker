#!/usr/bin/env python3
"""Seed test Morgan Dollar coins for testing"""

import sys
import os
from datetime import date
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, init_db
from models.coin_reference import CoinReference
from models.coin_price_guide import CoinPriceGuide

def seed_morgan_dollars():
    """Seed some Morgan Dollar coins for testing"""

    init_db()
    session = SessionLocal()

    # Sample Morgan Dollars from different years
    coins = [
        {
            'pcgsNumber': 7172,
            'year': 1921,
            'mintMark': None,
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1921 Morgan Dollar',
        },
        {
            'pcgsNumber': 7173,
            'year': 1921,
            'mintMark': 'D',
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1921-D Morgan Dollar',
        },
        {
            'pcgsNumber': 7174,
            'year': 1921,
            'mintMark': 'S',
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1921-S Morgan Dollar',
        },
        {
            'pcgsNumber': 7078,
            'year': 1878,
            'mintMark': None,
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1878 8TF Morgan Dollar',
        },
        {
            'pcgsNumber': 7090,
            'year': 1879,
            'mintMark': None,
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1879 Morgan Dollar',
        },
        {
            'pcgsNumber': 7132,
            'year': 1896,
            'mintMark': None,
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1896 Morgan Dollar',
        },
        {
            'pcgsNumber': 7146,
            'year': 1904,
            'mintMark': 'O',
            'denomination': 'Dollar',
            'series': 'Morgan Dollars',
            'fullName': '1904-O Morgan Dollar',
        },
    ]

    added_count = 0

    for coin_data in coins:
        # Check if coin already exists
        existing = session.query(CoinReference).filter_by(pcgsNumber=coin_data['pcgsNumber']).first()

        if existing:
            print(f"  Coin {coin_data['fullName']} already exists, skipping...")
            continue

        # Create new coin
        coin = CoinReference(**coin_data)
        session.add(coin)

        # Add some sample price guides for different grades
        grades = ['MS60', 'MS63', 'MS64', 'MS65', 'MS66', 'MS67']
        base_prices = [45, 50, 55, 75, 150, 500]  # Sample prices

        for grade, base_price in zip(grades, base_prices):
            price_guide = CoinPriceGuide(
                coinReferenceId=coin_data['pcgsNumber'],
                gradeCode=grade,
                pcgsPrice=Decimal(str(base_price)),
                priceDate=date.today()
            )
            session.add(price_guide)

        added_count += 1
        print(f"✓ Added {coin_data['fullName']} with {len(grades)} price guides")

    session.commit()
    print(f"\n✅ Seeded {added_count} Morgan Dollar coins!")
    session.close()

if __name__ == '__main__':
    print("Seeding test Morgan Dollar coins...")
    seed_morgan_dollars()
