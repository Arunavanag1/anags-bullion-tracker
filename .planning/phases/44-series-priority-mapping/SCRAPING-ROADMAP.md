# Coin Database Scraping Roadmap

## Overview

Expand the CoinReference database from ~100 coins to ~5,830+ coins covering all popular US collectible series from 1793 to present.

| Priority | Series Count | Est. Coins | Description |
|----------|-------------|------------|-------------|
| P0 | 9 | ~835 | Core modern bullion and key classics |
| P1 | 13 | ~1,340 | Popular 20th century collector series |
| P2 | 17 | ~1,180 | Complete 20th century coverage |
| P3 | 28 | ~2,475 | Early US, gold, and commemoratives |
| **Total** | **67** | **~5,830** | All target series |

## Data Source Strategy

### Primary: PCGS Public API (Phase 43 - Complete)
- **Rate Limit:** 1,000 calls/day (free tier)
- **Endpoints:** GetCoinFactsByCertNo, GetCoinFactsByGrade, GetAuctionPrices
- **Best for:** Real-time price data, auction prices, detailed coin info

### Secondary: Web Scraping (Phase 45 - Planned)
- **Rate:** ~2 coins/minute (polite delay)
- **Best for:** Bulk initial population, series listings
- **Fallback:** When API quota exhausted

### Hybrid Approach
1. Use API for high-value data (prices, auction history)
2. Use scraping for bulk series population
3. Scraping fills in when API quota exhausted

## Priority Breakdown

### P0: Core Modern & Key Classics (~835 coins)
**Scrape First** - Highest collector demand

| Series | Est. Coins | Notes |
|--------|-----------|-------|
| Silver Eagles | 45 | Modern bullion, annual releases |
| Gold Eagles | 160 | 4 denominations/year since 1986 |
| Platinum Eagles | 120 | Since 1997 |
| American Gold Buffalo | 40 | Since 2006, 24K gold |
| Morgan Dollars | 150 | 1878-1921, most popular US coin |
| Peace Dollars | 30 | 1921-1935 |
| Lincoln Cents Wheat | 145 | 1909-1958 |
| Mercury Dimes | 80 | 1916-1945 |
| Walking Liberty Halves | 65 | 1916-1947, beautiful design |

### P1: Popular Collector Series (~1,340 coins)
**Second Wave** - Strong collector base

| Series | Est. Coins | Notes |
|--------|-----------|-------|
| Jefferson Nickels | 250 | 1938-present |
| Buffalo Nickels | 75 | 1913-1938 |
| Roosevelt Dimes | 200 | 1946-present |
| Washington Quarters | 180 | 1932-1998 |
| Standing Liberty Quarters | 40 | 1916-1930 |
| Franklin Halves | 35 | 1948-1963 |
| Kennedy Half Dollars | 140 | 1964-present |
| Eisenhower Dollars | 35 | 1971-1978 |
| Susan B. Anthony Dollars | 18 | 1979-1999 |
| Sacagawea Dollars | 55 | 2000-present |
| Presidential Dollars | 80 | 2007-2020 |
| State Quarters | 112 | 1999-2008 |
| America the Beautiful Quarters | 120 | 2010-2021 |

### P2: Complete 20th Century (~1,180 coins)
**Third Wave** - Fill in gaps

| Series | Est. Coins | Notes |
|--------|-----------|-------|
| Barber Dimes | 75 | 1892-1916 |
| Barber Quarters | 75 | 1892-1916 |
| Barber Half Dollars | 75 | 1892-1915 |
| Indian Head Cents | 70 | 1859-1909 |
| Flying Eagle Cents | 8 | 1856-1858 |
| Lincoln Memorial Cents | 200 | 1959-2008 |
| Lincoln Shield Cents | 35 | 2010-present |
| Liberty Nickels | 40 | 1883-1912 |
| Shield Nickels | 30 | 1866-1883 |
| Seated Liberty (all) | 485 | 1837-1891 various |
| Trade Dollars | 20 | 1873-1885 |
| American Women Quarters | 25 | 2022-2025 |
| Innovation Dollars | 60 | 2018-2032 |
| Palladium Eagles | 12 | 2017-present |

### P3: Early US, Gold & Commemoratives (~2,475 coins)
**Final Wave** - Specialized collectors

**Early US Coinage:**
- Large Cents (200), Half Cents (80)
- Bust series (300 total across denominations)
- Obsolete denominations: 2¢, 3¢, 20¢ (125 total)
- Half Dimes (120)

**Pre-1933 Gold:**
- Gold Dollars (60)
- Quarter Eagles $2.50 (125)
- Three Dollar Gold (45)
- Half Eagles $5 (185)
- Eagles $10 (165)
- Double Eagles $20 (175)
- Early Gold (150)

**Commemoratives:**
- Classic 1892-1954 (180)
- Modern Silver (350)
- Modern Gold (120)
- Modern Clad (60)
- First Spouse Gold (45)

## Timeline Estimates

### API-Only Approach
- **Daily Capacity:** 1,000 API calls
- **P0 (~835 coins):** 1 day
- **P1 (~1,340 coins):** 2 days
- **P2 (~1,180 coins):** 2 days
- **P3 (~2,475 coins):** 3 days
- **Total:** ~8 days (assuming no failures/retries)

### Scraping-Only Approach
- **Daily Capacity:** ~1,440 coins (1/min × 24hr, but realistic ~8hr = 480)
- **P0 (~835 coins):** 2 days
- **P1 (~1,340 coins):** 3 days
- **P2 (~1,180 coins):** 3 days
- **P3 (~2,475 coins):** 6 days
- **Total:** ~14 days

### Hybrid Approach (Recommended)
1. **Morning:** API calls (1,000/day quota)
2. **Rest of day:** Scraping (polite rate)
3. **Estimated:** 7-10 days for full population

## Phase 45 Requirements

### Scraper Enhancements Needed
1. **Update HTML selectors:** PCGS website structure may have changed since original scraper
2. **Add NGC cross-reference:** Map PCGS numbers to NGC numbers where possible
3. **Improve error handling:** Better retry logic, session management
4. **Add progress tracking:** Resume capability for large series

### Data Mapping
- Verify `category_id` values match actual PCGS URLs
- Test scraper on each priority tier before full run
- Build validation for scraped data

## Phase 46 Requirements

### Population Pipeline
1. **Batch processing:** Process series in priority order
2. **Incremental updates:** Track what's been scraped, support resume
3. **Logging:** Detailed logs for monitoring progress
4. **Validation:** Post-scrape data quality checks

### Monitoring
- Daily progress reports
- API quota tracking (QuotaTracker from Phase 43)
- Failure tracking and retry queue

## Data Quality Considerations

### Required Fields
- `pcgsNumber` (primary key)
- `year`
- `series`
- `fullName`
- `denomination`

### Optional but Valuable
- `ngcNumber` (for cross-reference)
- `mintMark`
- `variety`
- `mintage`
- `metal`
- `weightOz`
- `fineness`

### Price Data
- Update weekly via scheduled job (Phase 47)
- Store historical prices for trend tracking
- API for real-time lookups when needed

## NGC Cross-Reference Notes

For Phase 45, consider adding NGC number mapping:
- NGC uses different numbering system than PCGS
- Cross-reference tables exist but may be incomplete
- User collections may have NGC-graded coins
- Lower priority than PCGS population

## Success Metrics

| Metric | Target |
|--------|--------|
| Total coins in database | 5,000+ |
| Series coverage | 60+ series |
| Price data freshness | < 7 days |
| API quota utilization | > 80% daily |
| Scraping success rate | > 95% |

## Next Steps

1. **Phase 45:** Update scraper for current PCGS website structure
2. **Phase 46:** Run population pipeline by priority tier
3. **Phase 47:** Set up automated price refresh
4. **Phase 48:** Full-text search optimization, admin reports
