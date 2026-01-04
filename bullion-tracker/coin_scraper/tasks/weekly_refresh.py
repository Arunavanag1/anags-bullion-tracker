"""Celery task for weekly price refresh"""

from celery import Celery
from celery.schedules import crontab
import asyncio
import sys
sys.path.append('..')

from database import SessionLocal
from scrapers.pcgs_scraper import run_scraper

app = Celery('coin_scraper', broker='redis://localhost:6379/0')

@app.task
def refresh_all_prices():
    """Run every Sunday at 2 AM"""
    db = SessionLocal()

    try:
        stats = asyncio.run(run_scraper(db))
        return f"Refreshed {stats['prices_scraped']} prices for {stats['coins_scraped']} coins"
    finally:
        db.close()

# Celery beat schedule
app.conf.beat_schedule = {
    'weekly-price-refresh': {
        'task': 'tasks.weekly_refresh.refresh_all_prices',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # Sunday 2 AM
    },
}
