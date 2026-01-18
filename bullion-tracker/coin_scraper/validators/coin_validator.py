"""
Coin Data Validator

Validates scraped coin data for completeness and correctness.
Used to ensure data quality before database insertion.
"""

import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Valid denominations for US coins
VALID_DENOMINATIONS = [
    # Cents
    "1C", "1¢", "One Cent", "Cent", "Half Cent", "1/2C",
    # Nickels
    "5C", "5¢", "Five Cent", "Nickel", "Three Cent", "3C", "3CN", "3CS",
    # Dimes
    "10C", "10¢", "Dime", "Ten Cent", "Half Dime", "H10C",
    # Quarters
    "25C", "25¢", "Quarter", "Twenty Cent", "20C",
    # Half Dollars
    "50C", "50¢", "Half Dollar", "Half",
    # Dollars
    "$1", "Dollar", "Trade Dollar", "T$1",
    # Gold denominations
    "$2.50", "Quarter Eagle", "$3", "Three Dollar",
    "$5", "Half Eagle", "$10", "Eagle",
    "$20", "Double Eagle", "$50",
    # Bullion
    "1 oz", "1/2 oz", "1/4 oz", "1/10 oz",
    "1 oz Silver", "1 oz Gold", "1 oz Platinum", "1 oz Palladium",
]

# Valid mint marks
VALID_MINT_MARKS = [
    None, "",  # No mint mark (Philadelphia pre-1980)
    "P", "D", "S", "O", "CC", "W", "C", "D/S", "S/D",
]


@dataclass
class ValidationError:
    """Represents a single validation error."""
    field: str
    message: str
    value: Any
    coin_identifier: str  # Usually PCGS number


@dataclass
class ValidationReport:
    """Aggregates validation results for a batch of coins."""
    total_coins: int = 0
    valid_coins: int = 0
    invalid_coins: int = 0
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)

    def add_error(self, error: ValidationError):
        """Add an error to the report."""
        self.errors.append(error)

    def add_warning(self, warning: ValidationError):
        """Add a warning to the report."""
        self.warnings.append(warning)

    def is_valid(self) -> bool:
        """Check if all coins are valid (no errors)."""
        return len(self.errors) == 0

    def summary(self) -> str:
        """Generate a summary string."""
        lines = [
            "=== Validation Report ===",
            f"Total coins: {self.total_coins}",
            f"Valid: {self.valid_coins}",
            f"Invalid: {self.invalid_coins}",
            f"Errors: {len(self.errors)}",
            f"Warnings: {len(self.warnings)}",
        ]

        if self.errors:
            lines.append("\n--- Errors ---")
            # Group errors by type
            error_types: Dict[str, List[ValidationError]] = {}
            for err in self.errors:
                if err.field not in error_types:
                    error_types[err.field] = []
                error_types[err.field].append(err)

            for field, errs in error_types.items():
                lines.append(f"  {field}: {len(errs)} errors")
                # Show first 3 examples
                for err in errs[:3]:
                    lines.append(f"    - {err.coin_identifier}: {err.message}")
                if len(errs) > 3:
                    lines.append(f"    ... and {len(errs) - 3} more")

        if self.warnings:
            lines.append(f"\n--- Warnings ---")
            for warn in self.warnings[:5]:
                lines.append(f"  {warn.coin_identifier}: {warn.message}")
            if len(self.warnings) > 5:
                lines.append(f"  ... and {len(self.warnings) - 5} more")

        return "\n".join(lines)


class CoinValidator:
    """
    Validates scraped coin data for completeness and correctness.

    Validates:
    - Required fields present
    - Year in valid range
    - PCGS number in reasonable range
    - Denomination from known list
    - Mint mark from valid list
    """

    CURRENT_YEAR = datetime.now().year
    MIN_YEAR = 1793  # First US coins
    MAX_YEAR = CURRENT_YEAR + 1  # Allow next year for proofs

    def __init__(self, strict: bool = False):
        """
        Initialize validator.

        Args:
            strict: If True, warnings become errors
        """
        self.strict = strict

    def validate_required_fields(self, coin_data: Dict) -> List[ValidationError]:
        """
        Validate that required fields are present and non-empty.

        Required fields:
        - pcgsNumber (or pcgs_number)
        - year
        - series
        - fullName (or full_name)
        """
        errors = []
        coin_id = str(coin_data.get('pcgsNumber') or coin_data.get('pcgs_number', 'unknown'))

        # Check PCGS number
        pcgs_num = coin_data.get('pcgsNumber') or coin_data.get('pcgs_number')
        if not pcgs_num:
            errors.append(ValidationError(
                field='pcgsNumber',
                message='PCGS number is required',
                value=None,
                coin_identifier=coin_id
            ))

        # Check year (can be None for some varieties, but warn)
        year = coin_data.get('year')
        if year is None:
            # This is a warning, not an error - some coins don't have years
            logger.debug(f"Coin {coin_id} has no year")

        # Check series
        series = coin_data.get('series')
        if not series:
            errors.append(ValidationError(
                field='series',
                message='Series is required',
                value=None,
                coin_identifier=coin_id
            ))

        # Check full name
        full_name = coin_data.get('fullName') or coin_data.get('full_name')
        if not full_name:
            errors.append(ValidationError(
                field='fullName',
                message='Full name is required',
                value=None,
                coin_identifier=coin_id
            ))

        return errors

    def validate_year_range(self, year: Optional[int]) -> Optional[ValidationError]:
        """
        Validate year is in acceptable range (1793 to current year + 1).

        Args:
            year: Year to validate (can be None)

        Returns:
            ValidationError if invalid, None if valid
        """
        if year is None:
            return None  # None is acceptable (no year coins)

        if not isinstance(year, int):
            return ValidationError(
                field='year',
                message=f'Year must be an integer, got {type(year).__name__}',
                value=year,
                coin_identifier='unknown'
            )

        if year < self.MIN_YEAR:
            return ValidationError(
                field='year',
                message=f'Year {year} is before first US coins ({self.MIN_YEAR})',
                value=year,
                coin_identifier='unknown'
            )

        if year > self.MAX_YEAR:
            return ValidationError(
                field='year',
                message=f'Year {year} is in the future (max: {self.MAX_YEAR})',
                value=year,
                coin_identifier='unknown'
            )

        return None

    def validate_pcgs_number(self, num: Optional[int]) -> Optional[ValidationError]:
        """
        Validate PCGS number is positive and in reasonable range.

        PCGS numbers are typically 3-8 digits.

        Args:
            num: PCGS number to validate

        Returns:
            ValidationError if invalid, None if valid
        """
        if num is None:
            return ValidationError(
                field='pcgsNumber',
                message='PCGS number is required',
                value=None,
                coin_identifier='unknown'
            )

        if not isinstance(num, int):
            return ValidationError(
                field='pcgsNumber',
                message=f'PCGS number must be an integer, got {type(num).__name__}',
                value=num,
                coin_identifier='unknown'
            )

        if num <= 0:
            return ValidationError(
                field='pcgsNumber',
                message=f'PCGS number must be positive, got {num}',
                value=num,
                coin_identifier=str(num)
            )

        # PCGS numbers are typically under 1 billion
        if num > 999999999:
            return ValidationError(
                field='pcgsNumber',
                message=f'PCGS number {num} seems too large',
                value=num,
                coin_identifier=str(num)
            )

        return None

    def validate_denomination(self, denom: Optional[str]) -> Optional[ValidationError]:
        """
        Validate denomination is from known list.

        Args:
            denom: Denomination string to validate

        Returns:
            ValidationError if invalid, None if valid or None
        """
        if denom is None or denom == "":
            return None  # No denomination is acceptable

        # Normalize for comparison
        denom_upper = denom.upper().strip()

        # Check against valid denominations (case-insensitive)
        for valid in VALID_DENOMINATIONS:
            if valid.upper() == denom_upper:
                return None

        # Also accept if it contains common patterns
        patterns = ['CENT', 'DOLLAR', 'OZ', 'EAGLE', 'DIME', 'QUARTER', 'HALF', 'NICKEL']
        for pattern in patterns:
            if pattern in denom_upper:
                return None

        return ValidationError(
            field='denomination',
            message=f'Unknown denomination: {denom}',
            value=denom,
            coin_identifier='unknown'
        )

    def validate_mint_mark(self, mm: Optional[str]) -> Optional[ValidationError]:
        """
        Validate mint mark is from known list.

        Args:
            mm: Mint mark to validate

        Returns:
            ValidationError if invalid, None if valid
        """
        if mm is None or mm == "":
            return None  # No mint mark is valid (Philadelphia)

        mm_upper = mm.upper().strip()

        for valid in VALID_MINT_MARKS:
            if valid and valid.upper() == mm_upper:
                return None

        return ValidationError(
            field='mintMark',
            message=f'Unknown mint mark: {mm}',
            value=mm,
            coin_identifier='unknown'
        )

    def validate_coin(self, coin_data: Dict) -> Tuple[bool, List[ValidationError], List[ValidationError]]:
        """
        Validate a single coin's data.

        Args:
            coin_data: Dictionary of coin data

        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []

        coin_id = str(coin_data.get('pcgsNumber') or coin_data.get('pcgs_number', 'unknown'))

        # Required fields
        errors.extend(self.validate_required_fields(coin_data))

        # PCGS number
        pcgs_num = coin_data.get('pcgsNumber') or coin_data.get('pcgs_number')
        pcgs_error = self.validate_pcgs_number(pcgs_num)
        if pcgs_error:
            pcgs_error.coin_identifier = coin_id
            errors.append(pcgs_error)

        # Year
        year = coin_data.get('year')
        year_error = self.validate_year_range(year)
        if year_error:
            year_error.coin_identifier = coin_id
            errors.append(year_error)

        # Denomination (warning only)
        denom = coin_data.get('denomination')
        denom_error = self.validate_denomination(denom)
        if denom_error:
            denom_error.coin_identifier = coin_id
            if self.strict:
                errors.append(denom_error)
            else:
                warnings.append(denom_error)

        # Mint mark (warning only)
        mm = coin_data.get('mintMark') or coin_data.get('mint_mark')
        mm_error = self.validate_mint_mark(mm)
        if mm_error:
            mm_error.coin_identifier = coin_id
            if self.strict:
                errors.append(mm_error)
            else:
                warnings.append(mm_error)

        is_valid = len(errors) == 0
        return is_valid, errors, warnings

    def validate_batch(self, coins: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Validate a batch of coins.

        Args:
            coins: List of coin data dictionaries

        Returns:
            Tuple of (valid_coins, invalid_coins)
        """
        valid = []
        invalid = []

        for coin in coins:
            is_valid, errors, warnings = self.validate_coin(coin)

            if errors:
                coin_id = coin.get('pcgsNumber') or coin.get('pcgs_number', 'unknown')
                logger.warning(f"Coin {coin_id} failed validation: {[e.message for e in errors]}")
                invalid.append(coin)
            else:
                valid.append(coin)

        logger.info(f"Batch validation: {len(valid)} valid, {len(invalid)} invalid out of {len(coins)} coins")
        return valid, invalid

    def validate_batch_with_report(self, coins: List[Dict]) -> ValidationReport:
        """
        Validate a batch of coins and return a detailed report.

        Args:
            coins: List of coin data dictionaries

        Returns:
            ValidationReport with all errors and warnings
        """
        report = ValidationReport(total_coins=len(coins))

        for coin in coins:
            is_valid, errors, warnings = self.validate_coin(coin)

            if is_valid:
                report.valid_coins += 1
            else:
                report.invalid_coins += 1

            for error in errors:
                report.add_error(error)

            for warning in warnings:
                report.add_warning(warning)

        return report
