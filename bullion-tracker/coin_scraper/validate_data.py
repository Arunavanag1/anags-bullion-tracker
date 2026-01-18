#!/usr/bin/env python3
"""
Data Validation CLI

Validates all CoinReference data in the database and generates quality reports.
Identifies missing fields, invalid data, stale prices, and coverage gaps.

Usage:
    python validate_data.py --summary           # Quick stats
    python validate_data.py --report            # Full validation report
    python validate_data.py --series "Morgan"   # Validate specific series
    python validate_data.py --export FILE       # Export report to markdown
    python validate_data.py --fix               # Auto-fix where possible
"""

import os
import sys
import argparse
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from validators.coin_validator import CoinValidator, ValidationReport, ValidationError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class DataQualityReport:
    """Comprehensive data quality report."""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    total_coins: int = 0
    coins_with_prices: int = 0
    coins_without_prices: int = 0
    stale_price_count: int = 0
    missing_search_vector: int = 0
    series_coverage: Dict[str, int] = field(default_factory=dict)
    validation_report: Optional[ValidationReport] = None
    stale_coins: List[Dict] = field(default_factory=list)
    missing_field_coins: List[Dict] = field(default_factory=list)

    def to_markdown(self) -> str:
        """Generate markdown report."""
        lines = [
            f"# Data Quality Report",
            f"",
            f"**Generated:** {self.timestamp}",
            f"",
            f"## Summary Statistics",
            f"",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Total Coins | {self.total_coins} |",
            f"| With Price Data | {self.coins_with_prices} |",
            f"| Without Price Data | {self.coins_without_prices} |",
            f"| Stale Prices (>30 days) | {self.stale_price_count} |",
            f"| Missing Search Vector | {self.missing_search_vector} |",
            f"",
        ]

        # Series coverage
        if self.series_coverage:
            lines.extend([
                "## Series Coverage",
                "",
                "| Series | Coin Count |",
                "|--------|------------|",
            ])
            for series, count in sorted(self.series_coverage.items(), key=lambda x: -x[1]):
                lines.append(f"| {series} | {count} |")
            lines.append("")

        # Validation results
        if self.validation_report:
            lines.extend([
                "## Validation Results",
                "",
                f"- Valid coins: {self.validation_report.valid_coins}",
                f"- Invalid coins: {self.validation_report.invalid_coins}",
                f"- Errors: {len(self.validation_report.errors)}",
                f"- Warnings: {len(self.validation_report.warnings)}",
                "",
            ])

            if self.validation_report.errors:
                lines.append("### Errors")
                lines.append("")
                # Group by field
                by_field: Dict[str, List[ValidationError]] = {}
                for err in self.validation_report.errors:
                    if err.field not in by_field:
                        by_field[err.field] = []
                    by_field[err.field].append(err)

                for fld, errs in by_field.items():
                    lines.append(f"**{fld}** ({len(errs)} errors)")
                    for err in errs[:5]:
                        lines.append(f"- PCGS {err.coin_identifier}: {err.message}")
                    if len(errs) > 5:
                        lines.append(f"- ... and {len(errs) - 5} more")
                    lines.append("")

            if self.validation_report.warnings:
                lines.append("### Warnings")
                lines.append("")
                for warn in self.validation_report.warnings[:10]:
                    lines.append(f"- PCGS {warn.coin_identifier}: {warn.message}")
                if len(self.validation_report.warnings) > 10:
                    lines.append(f"- ... and {len(self.validation_report.warnings) - 10} more")
                lines.append("")

        # Stale prices
        if self.stale_coins:
            lines.extend([
                "## Coins with Stale Prices",
                "",
                "| PCGS # | Name | Last Updated |",
                "|--------|------|--------------|",
            ])
            for coin in self.stale_coins[:20]:
                lines.append(f"| {coin['pcgsNumber']} | {coin['fullName'][:40]} | {coin['lastUpdated']} |")
            if len(self.stale_coins) > 20:
                lines.append(f"")
                lines.append(f"*... and {len(self.stale_coins) - 20} more*")
            lines.append("")

        # Missing fields
        if self.missing_field_coins:
            lines.extend([
                "## Coins with Missing Fields",
                "",
            ])
            for coin in self.missing_field_coins[:10]:
                lines.append(f"- PCGS {coin.get('pcgsNumber', 'unknown')}: missing {', '.join(coin.get('missing', []))}")
            if len(self.missing_field_coins) > 10:
                lines.append(f"- ... and {len(self.missing_field_coins) - 10} more")
            lines.append("")

        lines.append("---")
        lines.append(f"*Report generated by validate_data.py*")

        return "\n".join(lines)


class DataValidator:
    """Validates coin data in the database."""

    STALE_THRESHOLD_DAYS = 30

    def __init__(self, database_url: str):
        """Initialize with database connection."""
        self.engine = create_engine(database_url)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.coin_validator = CoinValidator(strict=False)

    def get_all_coins(self, series_filter: Optional[str] = None) -> List[Dict]:
        """Fetch all coins from database."""
        query = """
            SELECT
                id,
                "pcgsNumber",
                year,
                "mintMark",
                denomination,
                series,
                "fullName",
                metal,
                "searchVector" IS NOT NULL as has_search_vector,
                "updatedAt"
            FROM "CoinReference"
        """
        params = {}

        if series_filter:
            query += ' WHERE series ILIKE :series'
            params['series'] = f'%{series_filter}%'

        query += ' ORDER BY series, year'

        result = self.session.execute(text(query), params)
        coins = []
        for row in result:
            coins.append({
                'id': row[0],
                'pcgsNumber': row[1],
                'year': row[2],
                'mintMark': row[3],
                'denomination': row[4],
                'series': row[5],
                'fullName': row[6],
                'metal': row[7],
                'has_search_vector': row[8],
                'updatedAt': row[9],
            })
        return coins

    def get_price_stats(self) -> Dict:
        """Get price data statistics."""
        result = self.session.execute(text("""
            SELECT
                COUNT(DISTINCT c.id) as total_coins,
                COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN c.id END) as with_prices,
                COUNT(DISTINCT CASE WHEN p."priceDate" < CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as stale
            FROM "CoinReference" c
            LEFT JOIN "CoinPriceGuide" p ON c.id = p."coinReferenceId"
        """))
        row = result.fetchone()
        return {
            'total': row[0],
            'with_prices': row[1],
            'stale': row[2] or 0,
        }

    def get_stale_coins(self) -> List[Dict]:
        """Get coins with stale price data."""
        result = self.session.execute(text("""
            SELECT DISTINCT
                c."pcgsNumber",
                c."fullName",
                MAX(p."priceDate") as last_updated
            FROM "CoinReference" c
            JOIN "CoinPriceGuide" p ON c.id = p."coinReferenceId"
            WHERE p."priceDate" < CURRENT_DATE - INTERVAL '30 days'
            GROUP BY c."pcgsNumber", c."fullName"
            ORDER BY last_updated ASC
        """))
        coins = []
        for row in result:
            coins.append({
                'pcgsNumber': row[0],
                'fullName': row[1],
                'lastUpdated': row[2].strftime('%Y-%m-%d') if row[2] else 'unknown',
            })
        return coins

    def get_series_coverage(self) -> Dict[str, int]:
        """Get coin count by series."""
        result = self.session.execute(text("""
            SELECT series, COUNT(*) as count
            FROM "CoinReference"
            GROUP BY series
            ORDER BY count DESC
        """))
        return {row[0]: row[1] for row in result}

    def validate_all(self, series_filter: Optional[str] = None) -> DataQualityReport:
        """Run full validation and return report."""
        report = DataQualityReport()

        # Get coins
        coins = self.get_all_coins(series_filter)
        report.total_coins = len(coins)
        logger.info(f"Loaded {report.total_coins} coins for validation")

        # Count missing search vectors
        report.missing_search_vector = sum(1 for c in coins if not c.get('has_search_vector'))

        # Get price stats
        price_stats = self.get_price_stats()
        report.coins_with_prices = price_stats['with_prices']
        report.coins_without_prices = report.total_coins - report.coins_with_prices
        report.stale_price_count = price_stats['stale']

        # Get stale coins
        report.stale_coins = self.get_stale_coins()

        # Get series coverage
        report.series_coverage = self.get_series_coverage()

        # Run field validation
        report.validation_report = self.coin_validator.validate_batch_with_report(coins)

        # Identify coins with missing fields
        for coin in coins:
            missing = []
            if not coin.get('pcgsNumber'):
                missing.append('pcgsNumber')
            if not coin.get('series'):
                missing.append('series')
            if not coin.get('fullName'):
                missing.append('fullName')
            if not coin.get('denomination'):
                missing.append('denomination')

            if missing:
                report.missing_field_coins.append({
                    'pcgsNumber': coin.get('pcgsNumber', 'unknown'),
                    'missing': missing,
                })

        return report

    def fix_search_vectors(self) -> int:
        """Regenerate missing search vectors by triggering update."""
        result = self.session.execute(text("""
            UPDATE "CoinReference"
            SET "fullName" = "fullName"
            WHERE "searchVector" IS NULL
        """))
        self.session.commit()
        return result.rowcount

    def close(self):
        """Close database connection."""
        self.session.close()


def print_summary(report: DataQualityReport):
    """Print quick summary to console."""
    print("\n=== Data Quality Summary ===\n")
    print(f"Total coins:           {report.total_coins}")
    print(f"With price data:       {report.coins_with_prices}")
    print(f"Without price data:    {report.coins_without_prices}")
    print(f"Stale prices (>30d):   {report.stale_price_count}")
    print(f"Missing search vector: {report.missing_search_vector}")

    if report.validation_report:
        print(f"\nValidation:")
        print(f"  Valid:    {report.validation_report.valid_coins}")
        print(f"  Invalid:  {report.validation_report.invalid_coins}")
        print(f"  Errors:   {len(report.validation_report.errors)}")
        print(f"  Warnings: {len(report.validation_report.warnings)}")

    print(f"\nSeries coverage: {len(report.series_coverage)} series")
    top_series = sorted(report.series_coverage.items(), key=lambda x: -x[1])[:5]
    for series, count in top_series:
        print(f"  - {series}: {count} coins")

    print()


def main():
    parser = argparse.ArgumentParser(
        description='Validate coin data quality and generate reports',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument('--summary', action='store_true',
                        help='Quick summary (counts only)')
    parser.add_argument('--report', action='store_true',
                        help='Full validation report')
    parser.add_argument('--series', type=str, metavar='SERIES',
                        help='Validate specific series only')
    parser.add_argument('--export', type=str, metavar='FILE',
                        help='Export report to markdown file')
    parser.add_argument('--fix', action='store_true',
                        help='Auto-fix where possible (e.g., regenerate searchVector)')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Verbose output')

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Default to summary if no action specified
    if not any([args.summary, args.report, args.fix, args.export]):
        args.summary = True

    # Get database URL
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        sys.exit(1)

    # Initialize validator
    validator = DataValidator(database_url)

    try:
        # Handle fix action
        if args.fix:
            logger.info("Fixing missing search vectors...")
            fixed = validator.fix_search_vectors()
            print(f"Fixed {fixed} coins with missing search vectors")

        # Run validation
        logger.info("Running validation...")
        report = validator.validate_all(series_filter=args.series)

        # Output results
        if args.summary:
            print_summary(report)

        if args.report:
            if report.validation_report:
                print(report.validation_report.summary())

        if args.export:
            export_path = Path(args.export)
            if not export_path.suffix:
                export_path = export_path.with_suffix('.md')

            # Create logs directory if exporting there
            if 'logs' in str(export_path):
                export_path.parent.mkdir(parents=True, exist_ok=True)

            markdown = report.to_markdown()
            export_path.write_text(markdown)
            print(f"Report exported to: {export_path}")

        # Default export to logs if --report specified
        if args.report and not args.export:
            logs_dir = Path(__file__).parent.parent / 'logs'
            logs_dir.mkdir(exist_ok=True)
            default_path = logs_dir / f"validation_report_{datetime.now().strftime('%Y-%m-%d')}.md"
            markdown = report.to_markdown()
            default_path.write_text(markdown)
            print(f"\nReport saved to: {default_path}")

    finally:
        validator.close()


if __name__ == '__main__':
    main()
