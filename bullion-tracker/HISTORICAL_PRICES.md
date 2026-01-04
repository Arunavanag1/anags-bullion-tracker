# Historical Prices Database

This app uses a curated historical pricing database for accurate portfolio value charts going back 5 years.

## How It Works

### Historical Data (2020-2024)
- **Source**: `src/data/historical-prices.json`
- **Contains**: Monthly average prices for gold, silver, and platinum
- **Coverage**: January 2020 - December 2024 (60 data points)
- **Interpolation**: Daily prices are calculated by interpolating between monthly averages

### Current Live Prices
- **Source**: Metal Price API
- **Updates**: Twice daily (every 12 hours)
- **Purpose**: Shows real-time current spot prices on dashboard

## Weekly Update Process

To keep the historical database current, run the update script **once a week** (recommended: Sunday evenings):

```bash
npm run update-prices
```

### What the Script Does:
1. Fetches current gold, silver, and platinum prices from Metal Price API
2. Adds/updates the entry for the current month in `historical-prices.json`
3. Updates the `lastUpdated` timestamp

### Example Output:
```
Fetching current metal prices from API...
Current prices:
  Gold: $2650/oz
  Silver: $30.50/oz
  Platinum: $945/oz

Adding new entry for 2024-12-01...

✅ Historical prices updated successfully!
📁 File: src/data/historical-prices.json
📅 Last updated: 2024-12-30
📊 Total data points: 61
```

## Manual Updates

If you prefer to update prices manually, edit `src/data/historical-prices.json`:

```json
{
  "prices": [
    {
      "date": "2024-12-01",
      "gold": 2650,
      "silver": 30.50,
      "platinum": 945
    }
  ]
}
```

**Important**: Always use the first day of the month for consistency.

## Data Sources

Historical price data compiled from:
- [MacroTrends - Gold Prices](https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart)
- [MacroTrends - Silver Prices](https://www.macrotrends.net/1470/historical-silver-prices-100-year-chart)
- [Statista - Precious Metals](https://www.statista.com/statistics/675890/average-prices-gold-worldwide/)
- [World Gold Council](https://www.gold.org/goldhub/data/gold-prices)

Live current prices from:
- [Metal Price API](https://metalpriceapi.com)

## Maintenance Schedule

**Weekly** (Recommended: Sunday evening)
- Run `npm run update-prices` to add current month's data

**Monthly** (First week of new month)
- Verify the previous month's average was recorded correctly
- Check that interpolation is working smoothly

## Benefits of This Approach

✅ **Accurate Historical Data**: Real market prices, not estimates
✅ **No API Limits**: Historical data stored locally
✅ **Fast Performance**: No API calls for historical charts
✅ **Cost Effective**: Free API tier only used for current prices
✅ **Offline Capable**: Charts work even if API is down
