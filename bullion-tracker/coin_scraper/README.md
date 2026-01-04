# PCGS Coin Scraper

Scraper for populating coin reference database from PCGS CoinFacts to enable numismatics tracking in the Bullion Collection Tracker.

## Overview

This scraper collects coin reference data and pricing information from PCGS CoinFacts for major coin series including Silver Eagles, Gold Eagles, Morgan Dollars, and more. The data populates the database tables that power the coin search and valuation features.

## Features

- ✅ Async HTTP requests with proper rate limiting (1-2 second delays)
- ✅ Exponential backoff retry logic
- ✅ Scrapes 11 major coin series (~1,180 coins)
- ✅ Extracts price guide data for all grades (MS60-MS70, PR60-PR70, etc.)
- ✅ Full-text search token generation
- ✅ Weekly price refresh via Celery
- ✅ CLI tools for easy operation

## Setup

### 1. Install Python Dependencies

```bash
cd coin_scraper
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file or export:

```bash
export DATABASE_URL=postgresql://user:pass@localhost:5432/bullion_tracker
```

### 3. Apply Prisma Migrations

The database schema has been updated with three new tables:
- `CoinReference` - Core coin metadata
- `ValidGrade` - Lookup table for grades (MS60, PR70, etc.)
- `CoinPriceGuide` - Price data by grade and date

Run Prisma migration:

```bash
cd ..  # Back to bullion-tracker directory
npx prisma db push
```

### 4. Seed Valid Grades

Before scraping coins, seed the grades table:

```bash
cd coin_scraper/scripts
python3 seed_grades.py
```

This will insert 41 grades (PO01 through PR70).

## Usage

### Scrape Specific Series (Testing)

Start with Silver Eagles to test the scraper:

```bash
python3 scripts/run_scraper.py --series silver-eagles
```

### Scrape Priority P0 Series

Scrape the most important series (Silver Eagles, Gold Eagles, Morgan Dollars, Lincoln Cents, Jefferson Nickels):

```bash
python3 scripts/run_scraper.py --priority P0
```

### Scrape All Series

Scrape all 11 configured series (~1,180 coins):

```bash
python3 scripts/run_scraper.py --all
```

**Note**: This will take ~30-40 minutes due to rate limiting. Run during off-peak hours.

### Refresh Prices Only

To update prices without re-scraping coin metadata:

```bash
python3 scripts/refresh_prices.py
```

## Weekly Automated Refresh

To set up weekly price updates with Celery:

### 1. Start Redis

```bash
redis-server
```

### 2. Start Celery Worker

```bash
cd coin_scraper
celery -A tasks.weekly_refresh worker --beat --loglevel=info
```

This will refresh all coin prices every Sunday at 2 AM.

## Database Schema

### CoinReference

| Field | Type | Description |
|-------|------|-------------|
| pcgsNumber | Int | PCGS catalog number (unique) |
| year | Int | Coin year |
| mintMark | String | Mint mark (D, S, P, etc.) |
| denomination | String | Face value ($1, 5C, etc.) |
| series | String | Series name (Silver Eagles, etc.) |
| variety | String | Variety/type (Proof, Business Strike) |
| fullName | String | Complete display name |
| searchTokens | String | Full-text search index |

### ValidGrade

| Field | Type | Description |
|-------|------|-------------|
| gradeCode | String | Grade code (MS65, PR70, etc.) |
| numericValue | Int | Numeric grade (60-70) |
| gradeCategory | String | Category (Mint State, Proof, etc.) |
| displayOrder | Int | Sort order |

### CoinPriceGuide

| Field | Type | Description |
|-------|------|-------------|
| coinReferenceId | String | Foreign key to CoinReference |
| gradeCode | String | Foreign key to ValidGrade |
| pcgsPrice | Decimal | PCGS price guide value |
| priceDate | Date | Date of price snapshot |

## Scraped Series

| Series | Priority | Est. Coins | Status |
|--------|----------|------------|--------|
| Silver Eagles | P0 | ~80 | ✅ Ready |
| Gold Eagles | P0 | ~150 | ✅ Ready |
| Morgan Dollars | P0 | ~100 | ✅ Ready |
| Lincoln Cents | P0 | ~300 | ✅ Ready |
| Jefferson Nickels | P0 | ~200 | ✅ Ready |
| Peace Dollars | P1 | ~25 | ✅ Ready |
| Barber Dimes | P1 | ~75 | ✅ Ready |
| Barber Quarters | P1 | ~75 | ✅ Ready |
| Barber Halves | P1 | ~75 | ✅ Ready |
| Walking Liberty Halves | P1 | ~65 | ✅ Ready |
| Franklin Halves | P1 | ~35 | ✅ Ready |

**Total**: ~1,180 coins

## Rate Limiting & Politeness

The scraper follows best practices:

- **1-2 second delay** between all requests
- **Exponential backoff** on failures (2^retry seconds)
- **Max 3 retries** before skipping
- **Proper User-Agent** header identifying the app
- **Respects robots.txt** (manual verification)

Please run during **off-peak hours** (late night/early morning).

## Expected Output

After running `--all`:
- `CoinReference`: ~1,180 rows
- `CoinPriceGuide`: ~23,600 rows (1,180 coins × ~20 grades)
- `ValidGrade`: 41 rows

## Integration with Bullion Tracker

After scraping, coins can be searched and added to collections:

1. User searches for "1921 Morgan Dollar"
2. Search queries `CoinReference.searchTokens`
3. Matching coins displayed with current PCGS prices
4. User selects coin and grade
5. Price auto-populated from `CoinPriceGuide`
6. Coin added to collection

## Troubleshooting

### "Failed to fetch series page"

- Check internet connection
- Verify PCGS CoinFacts is accessible
- HTML structure may have changed (update selectors)

### "Invalid grade code"

- Run `python3 scripts/seed_grades.py` first
- Check that `ValidGrade` table is populated

### "Connection refused to database"

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npx prisma db push` to apply schema

## Future Enhancements

- [ ] NGC coin support
- [ ] CAC (Coin & Currency) premium data
- [ ] Population reports (rarity data)
- [ ] Auction results integration
- [ ] Image scraping for coin photos

## Legal & Ethics

This scraper is for **personal use only** in a non-commercial app. It:
- Respects rate limits
- Uses proper identification
- Caches responses to minimize requests
- Follows PCGS terms of service

Do not use this for commercial purposes or bulk resale of PCGS data.

## License

MIT License - See parent project for details.
