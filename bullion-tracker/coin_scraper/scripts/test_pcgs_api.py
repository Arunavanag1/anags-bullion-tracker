#!/usr/bin/env python3
"""
PCGS API Test Script

Test the PCGS API client and quota tracking.

Usage:
    # Check quota status (no API call, no credentials needed)
    python scripts/test_pcgs_api.py --status

    # Fetch coin by certificate number (requires credentials)
    python scripts/test_pcgs_api.py --cert-no 12345678

    # Fetch coin by PCGS number and grade (requires credentials)
    python scripts/test_pcgs_api.py --pcgs-number 9801 --grade MS65

    # Fetch auction prices (requires credentials)
    python scripts/test_pcgs_api.py --auction 9801

Environment variables required for API calls:
    PCGS_USERNAME: Your PCGS account email
    PCGS_PASSWORD: Your PCGS account password
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.quota_tracker import QuotaTracker
from api.pcgs_api import PCGSApiClient, PCGSApiError, AuthenticationError, QuotaExceededError


def print_json(data: dict, indent: int = 2):
    """Pretty print JSON data."""
    print(json.dumps(data, indent=indent, default=str))


def check_credentials() -> bool:
    """Check if PCGS credentials are set."""
    username = os.getenv("PCGS_USERNAME")
    password = os.getenv("PCGS_PASSWORD")
    return bool(username and password)


async def run_status(tracker: QuotaTracker):
    """Show quota status."""
    print("\n=== PCGS API Quota Status ===")
    status = tracker.get_status()
    print(f"Date:            {status['date']}")
    print(f"Calls made:      {status['calls_made']}")
    print(f"Calls remaining: {status['calls_remaining']}")
    print(f"Daily limit:     {status['daily_limit']}")
    print(f"Last call:       {status['last_call_at'] or 'Never'}")
    print(f"Quota file:      {status['quota_file']}")

    # Check credentials
    if check_credentials():
        print("\nCredentials:     Set (PCGS_USERNAME, PCGS_PASSWORD)")
    else:
        print("\nCredentials:     NOT SET")
        print("  Set PCGS_USERNAME and PCGS_PASSWORD environment variables to make API calls.")


async def run_cert_lookup(cert_no: str, tracker: QuotaTracker):
    """Look up coin by certificate number."""
    if not check_credentials():
        print("\nError: PCGS credentials not set.")
        print("Set PCGS_USERNAME and PCGS_PASSWORD environment variables.")
        sys.exit(1)

    print(f"\n=== Looking up cert #{cert_no} ===")

    async with PCGSApiClient(quota_tracker=tracker) as client:
        try:
            await client.authenticate()
            print("Authentication successful.")

            result = await client.get_coin_by_cert(cert_no)
            print("\nCoin Data:")
            print_json(result)

            print(f"\nQuota remaining: {tracker.get_remaining()}")

        except AuthenticationError as e:
            print(f"\nAuthentication failed: {e.message}")
            sys.exit(1)
        except QuotaExceededError as e:
            print(f"\nQuota exceeded: {e.message}")
            sys.exit(1)
        except PCGSApiError as e:
            print(f"\nAPI error: {e.message}")
            if e.status_code:
                print(f"Status code: {e.status_code}")
            sys.exit(1)


async def run_pcgs_lookup(pcgs_number: int, grade: str, tracker: QuotaTracker):
    """Look up coin by PCGS number and grade."""
    if not check_credentials():
        print("\nError: PCGS credentials not set.")
        print("Set PCGS_USERNAME and PCGS_PASSWORD environment variables.")
        sys.exit(1)

    print(f"\n=== Looking up PCGS #{pcgs_number} in grade {grade} ===")

    async with PCGSApiClient(quota_tracker=tracker) as client:
        try:
            await client.authenticate()
            print("Authentication successful.")

            result = await client.get_coin_by_pcgs_and_grade(pcgs_number, grade)
            print("\nCoin Data:")
            print_json(result)

            print(f"\nQuota remaining: {tracker.get_remaining()}")

        except AuthenticationError as e:
            print(f"\nAuthentication failed: {e.message}")
            sys.exit(1)
        except QuotaExceededError as e:
            print(f"\nQuota exceeded: {e.message}")
            sys.exit(1)
        except PCGSApiError as e:
            print(f"\nAPI error: {e.message}")
            if e.status_code:
                print(f"Status code: {e.status_code}")
            sys.exit(1)


async def run_auction_lookup(pcgs_number: int, grade: Optional[str], tracker: QuotaTracker):
    """Look up auction prices for a coin."""
    if not check_credentials():
        print("\nError: PCGS credentials not set.")
        print("Set PCGS_USERNAME and PCGS_PASSWORD environment variables.")
        sys.exit(1)

    grade_str = f" in grade {grade}" if grade else ""
    print(f"\n=== Looking up auction prices for PCGS #{pcgs_number}{grade_str} ===")

    async with PCGSApiClient(quota_tracker=tracker) as client:
        try:
            await client.authenticate()
            print("Authentication successful.")

            result = await client.get_auction_prices(pcgs_number, grade)
            print("\nAuction Prices:")
            print_json(result)

            print(f"\nQuota remaining: {tracker.get_remaining()}")

        except AuthenticationError as e:
            print(f"\nAuthentication failed: {e.message}")
            sys.exit(1)
        except QuotaExceededError as e:
            print(f"\nQuota exceeded: {e.message}")
            sys.exit(1)
        except PCGSApiError as e:
            print(f"\nAPI error: {e.message}")
            if e.status_code:
                print(f"Status code: {e.status_code}")
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Test PCGS API client and quota tracking",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--status", "-s",
        action="store_true",
        help="Show quota status (no API call required)"
    )
    parser.add_argument(
        "--cert-no", "-c",
        type=str,
        help="Certificate number to look up (7-8 digits)"
    )
    parser.add_argument(
        "--pcgs-number", "-p",
        type=int,
        help="PCGS catalog number to look up"
    )
    parser.add_argument(
        "--grade", "-g",
        type=str,
        help="Grade for PCGS number lookup (e.g., MS65, PR70)"
    )
    parser.add_argument(
        "--auction", "-a",
        type=int,
        help="Get auction prices for PCGS number"
    )

    args = parser.parse_args()

    # Validate arguments
    if not any([args.status, args.cert_no, args.pcgs_number, args.auction]):
        parser.print_help()
        print("\nError: Must specify --status, --cert-no, --pcgs-number, or --auction")
        sys.exit(1)

    if args.pcgs_number and not args.grade:
        print("Error: --grade is required when using --pcgs-number")
        sys.exit(1)

    # Initialize quota tracker
    tracker = QuotaTracker()

    # Run requested operation
    if args.status:
        asyncio.run(run_status(tracker))
    elif args.cert_no:
        asyncio.run(run_cert_lookup(args.cert_no, tracker))
    elif args.pcgs_number:
        asyncio.run(run_pcgs_lookup(args.pcgs_number, args.grade, tracker))
    elif args.auction:
        asyncio.run(run_auction_lookup(args.auction, args.grade, tracker))


if __name__ == "__main__":
    main()
