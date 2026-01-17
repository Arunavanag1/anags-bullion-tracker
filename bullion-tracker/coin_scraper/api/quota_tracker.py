"""
PCGS API Quota Tracker

Tracks daily API usage to stay within the 1,000 calls/day free tier limit.
Persists quota data to JSON file for cross-session tracking.
"""

import json
import os
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Default data directory relative to this file
DEFAULT_DATA_DIR = Path(__file__).parent.parent / "data"
DEFAULT_QUOTA_FILE = DEFAULT_DATA_DIR / "api_quota.json"


class QuotaTracker:
    """
    Tracks PCGS API quota usage with daily reset.

    Usage:
        tracker = QuotaTracker()
        if tracker.check_quota():
            # Make API call...
            tracker.record_call()
        else:
            print(f"Quota exceeded: {tracker.get_status()}")
    """

    DAILY_LIMIT = 1000  # PCGS free tier limit

    def __init__(self, quota_file: Optional[Path] = None):
        """
        Initialize quota tracker.

        Args:
            quota_file: Path to JSON file for persistence. Defaults to data/api_quota.json
        """
        self.quota_file = quota_file or DEFAULT_QUOTA_FILE
        self._ensure_data_dir()
        self._load_or_create()

    def _ensure_data_dir(self):
        """Create data directory if it doesn't exist."""
        self.quota_file.parent.mkdir(parents=True, exist_ok=True)

    def _load_or_create(self):
        """Load existing quota data or create new."""
        if self.quota_file.exists():
            try:
                with open(self.quota_file, 'r') as f:
                    self._data = json.load(f)
                logger.debug(f"Loaded quota data: {self._data}")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to load quota file, creating new: {e}")
                self._create_new()
        else:
            self._create_new()

        # Check if we need to reset for new day
        self._reset_if_new_day()

    def _create_new(self):
        """Create fresh quota data."""
        self._data = {
            "date": str(date.today()),
            "calls_made": 0,
            "daily_limit": self.DAILY_LIMIT,
            "last_call_at": None
        }
        self._save()

    def _save(self):
        """Persist quota data to JSON file."""
        try:
            with open(self.quota_file, 'w') as f:
                json.dump(self._data, f, indent=2)
            logger.debug(f"Saved quota data: {self._data}")
        except IOError as e:
            logger.error(f"Failed to save quota file: {e}")

    def _reset_if_new_day(self):
        """Reset quota counter if date has changed."""
        stored_date = self._data.get("date")
        today = str(date.today())

        if stored_date != today:
            logger.info(f"New day detected ({stored_date} -> {today}), resetting quota")
            old_calls = self._data.get("calls_made", 0)
            self._data = {
                "date": today,
                "calls_made": 0,
                "daily_limit": self.DAILY_LIMIT,
                "last_call_at": None
            }
            self._save()
            logger.info(f"Quota reset. Previous day used {old_calls}/{self.DAILY_LIMIT} calls.")

    def check_quota(self) -> bool:
        """
        Check if API quota is available.

        Returns:
            True if calls remaining > 0, False if quota exceeded
        """
        self._reset_if_new_day()
        remaining = self._data["daily_limit"] - self._data["calls_made"]
        return remaining > 0

    def record_call(self) -> int:
        """
        Record an API call and return remaining calls.

        Returns:
            Number of calls remaining for today
        """
        self._reset_if_new_day()

        self._data["calls_made"] += 1
        self._data["last_call_at"] = datetime.now().isoformat()
        self._save()

        remaining = self._data["daily_limit"] - self._data["calls_made"]
        logger.info(f"API call recorded. {remaining} calls remaining today.")
        return remaining

    def get_status(self) -> Dict[str, Any]:
        """
        Get current quota status.

        Returns:
            Dict with date, calls_made, calls_remaining, daily_limit, last_call_at
        """
        self._reset_if_new_day()

        calls_remaining = self._data["daily_limit"] - self._data["calls_made"]
        return {
            "date": self._data["date"],
            "calls_made": self._data["calls_made"],
            "calls_remaining": calls_remaining,
            "daily_limit": self._data["daily_limit"],
            "last_call_at": self._data.get("last_call_at"),
            "quota_file": str(self.quota_file),
        }

    def get_remaining(self) -> int:
        """Get number of calls remaining today."""
        self._reset_if_new_day()
        return self._data["daily_limit"] - self._data["calls_made"]

    def reset(self):
        """Manually reset quota (for testing)."""
        self._create_new()
        logger.info("Quota manually reset")
