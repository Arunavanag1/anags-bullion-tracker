"""
Progress tracker for scraping operations with SQLite backend.

Enables stop/resume capability for large scraping operations by persisting:
- Series started/completed status
- Individual coin scraping status
- Failure tracking with retry counts
"""

import sqlite3
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ProgressStats:
    """Statistics from progress tracking."""
    series_started: int
    series_completed: int
    coins_attempted: int
    coins_completed: int
    coins_failed: int
    last_activity: Optional[datetime]


class ProgressTracker:
    """
    SQLite-backed progress tracker for scraping operations.

    Tracks series and coin scraping progress to enable resume capability.
    """

    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize progress tracker.

        Args:
            db_path: Path to SQLite database file. Defaults to
                     bullion-tracker/coin_scraper/data/scrape_progress.db
        """
        if db_path is None:
            # Default path relative to this file
            data_dir = Path(__file__).parent.parent / "data"
            data_dir.mkdir(exist_ok=True)
            db_path = str(data_dir / "scrape_progress.db")

        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()

            # Series progress table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS series_progress (
                    slug TEXT PRIMARY KEY,
                    status TEXT NOT NULL DEFAULT 'pending',
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    coins_found INTEGER DEFAULT 0,
                    coins_scraped INTEGER DEFAULT 0,
                    coins_failed INTEGER DEFAULT 0
                )
            """)

            # Coin progress table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS coin_progress (
                    pcgs_number INTEGER PRIMARY KEY,
                    series_slug TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    attempted_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    retry_count INTEGER DEFAULT 0,
                    error_message TEXT,
                    FOREIGN KEY (series_slug) REFERENCES series_progress(slug)
                )
            """)

            # Create indexes for efficient queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_coin_series
                ON coin_progress(series_slug)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_coin_status
                ON coin_progress(status)
            """)

            # Run tracking table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scrape_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    started_at TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP,
                    priority_filter TEXT,
                    series_filter TEXT,
                    coins_scraped INTEGER DEFAULT 0,
                    coins_failed INTEGER DEFAULT 0
                )
            """)

            conn.commit()
            logger.debug(f"Progress database initialized at {self.db_path}")

        finally:
            conn.close()

    def _get_conn(self) -> sqlite3.Connection:
        """Get a database connection with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # ===== Series Tracking =====

    def mark_series_started(self, slug: str, coins_found: int = 0):
        """Mark a series as started."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO series_progress (slug, status, started_at, coins_found)
                VALUES (?, 'in_progress', ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                    status = 'in_progress',
                    started_at = COALESCE(series_progress.started_at, ?),
                    coins_found = ?
            """, (slug, datetime.now(), coins_found, datetime.now(), coins_found))
            conn.commit()
            logger.info(f"Series started: {slug} ({coins_found} coins)")
        finally:
            conn.close()

    def mark_series_complete(self, slug: str):
        """Mark a series as completed."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()

            # Get counts from coin_progress
            cursor.execute("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                FROM coin_progress WHERE series_slug = ?
            """, (slug,))
            row = cursor.fetchone()

            cursor.execute("""
                UPDATE series_progress
                SET status = 'completed',
                    completed_at = ?,
                    coins_scraped = ?,
                    coins_failed = ?
                WHERE slug = ?
            """, (datetime.now(), row['completed'] or 0, row['failed'] or 0, slug))
            conn.commit()
            logger.info(f"Series completed: {slug} ({row['completed']} scraped, {row['failed']} failed)")
        finally:
            conn.close()

    def is_series_complete(self, slug: str) -> bool:
        """Check if a series is already completed."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT status FROM series_progress WHERE slug = ?",
                (slug,)
            )
            row = cursor.fetchone()
            return row is not None and row['status'] == 'completed'
        finally:
            conn.close()

    def get_series_status(self, slug: str) -> Optional[Dict]:
        """Get detailed status for a series."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM series_progress WHERE slug = ?",
                (slug,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    # ===== Coin Tracking =====

    def mark_coin_complete(self, pcgs_number: int, series_slug: str = "unknown"):
        """Mark a coin as successfully scraped."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO coin_progress (pcgs_number, series_slug, status, attempted_at, completed_at)
                VALUES (?, ?, 'completed', ?, ?)
                ON CONFLICT(pcgs_number) DO UPDATE SET
                    status = 'completed',
                    completed_at = ?,
                    retry_count = coin_progress.retry_count + 1
            """, (pcgs_number, series_slug, datetime.now(), datetime.now(), datetime.now()))
            conn.commit()
        finally:
            conn.close()

    def mark_coin_failed(self, pcgs_number: int, series_slug: str = "unknown", error: str = None):
        """Mark a coin as failed to scrape."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO coin_progress (pcgs_number, series_slug, status, attempted_at, error_message, retry_count)
                VALUES (?, ?, 'failed', ?, ?, 1)
                ON CONFLICT(pcgs_number) DO UPDATE SET
                    status = 'failed',
                    attempted_at = ?,
                    error_message = ?,
                    retry_count = coin_progress.retry_count + 1
            """, (pcgs_number, series_slug, datetime.now(), error, datetime.now(), error))
            conn.commit()
        finally:
            conn.close()

    def is_coin_complete(self, pcgs_number: int) -> bool:
        """Check if a coin has already been successfully scraped."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT status FROM coin_progress WHERE pcgs_number = ?",
                (pcgs_number,)
            )
            row = cursor.fetchone()
            return row is not None and row['status'] == 'completed'
        finally:
            conn.close()

    def get_failed_coins(self, series_slug: str = None, max_retries: int = 3) -> List[int]:
        """Get list of failed coins eligible for retry."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            if series_slug:
                cursor.execute("""
                    SELECT pcgs_number FROM coin_progress
                    WHERE status = 'failed'
                      AND series_slug = ?
                      AND retry_count < ?
                    ORDER BY attempted_at
                """, (series_slug, max_retries))
            else:
                cursor.execute("""
                    SELECT pcgs_number FROM coin_progress
                    WHERE status = 'failed' AND retry_count < ?
                    ORDER BY attempted_at
                """, (max_retries,))
            return [row['pcgs_number'] for row in cursor.fetchall()]
        finally:
            conn.close()

    # ===== Resume Capability =====

    def get_resume_point(self) -> Optional[Dict]:
        """
        Find where to resume scraping.

        Returns info about the last in-progress series, or None if all complete.
        """
        conn = self._get_conn()
        try:
            cursor = conn.cursor()

            # Find in-progress series
            cursor.execute("""
                SELECT slug, coins_found, coins_scraped, coins_failed
                FROM series_progress
                WHERE status = 'in_progress'
                ORDER BY started_at DESC
                LIMIT 1
            """)
            row = cursor.fetchone()

            if row:
                # Get last completed coin in this series
                cursor.execute("""
                    SELECT MAX(pcgs_number) as last_coin
                    FROM coin_progress
                    WHERE series_slug = ? AND status = 'completed'
                """, (row['slug'],))
                last = cursor.fetchone()

                return {
                    'series_slug': row['slug'],
                    'coins_found': row['coins_found'],
                    'coins_scraped': row['coins_scraped'],
                    'coins_failed': row['coins_failed'],
                    'last_completed_coin': last['last_coin'] if last else None,
                }
            return None
        finally:
            conn.close()

    def get_pending_series(self, priority: str = None) -> List[str]:
        """Get list of series slugs that haven't been completed."""
        from config import COIN_SERIES

        completed = set()
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT slug FROM series_progress WHERE status = 'completed'"
            )
            completed = {row['slug'] for row in cursor.fetchall()}
        finally:
            conn.close()

        pending = []
        for series in COIN_SERIES:
            if series['slug'] not in completed:
                if priority is None or series.get('priority') == priority:
                    pending.append(series['slug'])

        return pending

    # ===== Statistics =====

    def get_stats(self) -> ProgressStats:
        """Get overall progress statistics."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()

            # Series stats
            cursor.execute("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as started,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM series_progress
            """)
            series_row = cursor.fetchone()

            # Coin stats
            cursor.execute("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                FROM coin_progress
            """)
            coin_row = cursor.fetchone()

            # Last activity
            cursor.execute("""
                SELECT MAX(completed_at) as last_activity FROM coin_progress
            """)
            activity_row = cursor.fetchone()

            last_activity = None
            if activity_row and activity_row['last_activity']:
                last_activity = datetime.fromisoformat(activity_row['last_activity'])

            return ProgressStats(
                series_started=series_row['started'] or 0,
                series_completed=series_row['completed'] or 0,
                coins_attempted=coin_row['total'] or 0,
                coins_completed=coin_row['completed'] or 0,
                coins_failed=coin_row['failed'] or 0,
                last_activity=last_activity,
            )
        finally:
            conn.close()

    def get_progress_summary(self) -> str:
        """Get a formatted progress summary string."""
        stats = self.get_stats()

        lines = [
            "=== Scraping Progress ===",
            f"Series: {stats.series_completed} complete, {stats.series_started} in progress",
            f"Coins: {stats.coins_completed} scraped, {stats.coins_failed} failed",
        ]

        if stats.last_activity:
            lines.append(f"Last activity: {stats.last_activity.strftime('%Y-%m-%d %H:%M:%S')}")

        # Add pending series count
        pending = self.get_pending_series()
        if pending:
            lines.append(f"Pending series: {len(pending)}")

        # Resume point
        resume = self.get_resume_point()
        if resume:
            lines.append(f"\nResume from: {resume['series_slug']}")
            lines.append(f"  Coins so far: {resume['coins_scraped']}/{resume['coins_found']}")

        return "\n".join(lines)

    def reset(self, confirm: bool = False):
        """
        Reset all progress (dangerous!).

        Args:
            confirm: Must be True to actually reset.
        """
        if not confirm:
            raise ValueError("Must pass confirm=True to reset progress")

        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM coin_progress")
            cursor.execute("DELETE FROM series_progress")
            cursor.execute("DELETE FROM scrape_runs")
            conn.commit()
            logger.warning("Progress tracking reset!")
        finally:
            conn.close()

    # ===== Run Tracking =====

    def start_run(self, priority_filter: str = None, series_filter: str = None) -> int:
        """Start a new scraping run and return its ID."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO scrape_runs (started_at, priority_filter, series_filter)
                VALUES (?, ?, ?)
            """, (datetime.now(), priority_filter, series_filter))
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()

    def complete_run(self, run_id: int, coins_scraped: int, coins_failed: int):
        """Mark a scraping run as complete."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE scrape_runs
                SET completed_at = ?, coins_scraped = ?, coins_failed = ?
                WHERE id = ?
            """, (datetime.now(), coins_scraped, coins_failed, run_id))
            conn.commit()
        finally:
            conn.close()
