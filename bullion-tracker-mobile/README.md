# Bullion Tracker Mobile

A React Native mobile app for tracking your precious metals collection with real-time pricing, built with Expo.

## Features

- **Portfolio Dashboard**: View total melt value, book value, and gain/loss
- **Live Spot Prices**: Real-time gold, silver, and platinum prices
- **Collection Management**: Add, edit, and delete bullion items
- **Historical Charts**: Portfolio value over time (1W, 1M, 1Y, 5Y)
- **Photo Support**: Take photos or upload from gallery
- **Offline First**: SQLite database for local storage
- **Historical Price Database**: Curated monthly prices from 2020-2025

## Tech Stack

- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **SQLite** for local data storage
- **Victory Native** for charts
- **React Navigation** for navigation
- **Expo Image Picker** for photos
- **NativeWind** (planned) for styling

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Expo Go app on your phone (for testing)
- OR iOS Simulator / Android Emulator

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API Key**:

   Edit `app.json` and add your Metal Price API key:
   ```json
   {
     "expo": {
       "extra": {
         "metalPriceApiKey": "YOUR_API_KEY_HERE"
       }
     }
   }
   ```

   Get a free API key at: https://metalpriceapi.com

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - **iOS**: Press `i` or run `npm run ios`
   - **Android**: Press `a` or run `npm run android`
   - **Expo Go**: Scan the QR code with your phone

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Card, Input)
│   └── PortfolioChart.tsx
├── screens/
│   ├── DashboardScreen.tsx
│   ├── CollectionScreen.tsx
│   └── AddItemScreen.tsx
├── lib/
│   ├── database.ts      # SQLite CRUD operations
│   ├── historical-data.ts # Price interpolation
│   ├── prices.ts        # Metal Price API
│   └── calculations.ts  # Portfolio math
├── data/
│   └── historical-prices.json # 2020-2025 price database
└── types/
    └── index.ts         # TypeScript types
```

## Database Schema

The app uses SQLite with the following schema:

```sql
CREATE TABLE collection (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  metal TEXT NOT NULL CHECK(metal IN ('gold', 'silver', 'platinum')),
  weight REAL NOT NULL,
  purity REAL NOT NULL,
  purchase_price REAL NOT NULL,
  purchase_date TEXT NOT NULL,
  notes TEXT,
  image_uri TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Building for Production

### iOS

1. Configure your bundle identifier in `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.yourcompany.bulliontracker"
   }
   ```

2. Build:
   ```bash
   npx eas build --platform ios
   ```

### Android

1. Configure your package name in `app.json`:
   ```json
   "android": {
     "package": "com.yourcompany.bulliontracker"
   }
   ```

2. Build:
   ```bash
   npx eas build --platform android
   ```

## Historical Price Data

The app includes a curated database of monthly precious metals prices from 2020-2025:
- **Source**: `src/data/historical-prices.json`
- **Coverage**: Monthly averages (73 data points)
- **Interpolation**: Linear interpolation for daily values
- **Live Prices**: Metal Price API for current spot prices

To update with latest prices, update the JSON file with current month's data.

## Features by Screen

### Dashboard
- Current spot prices ticker
- Portfolio summary (melt value, book value, gain/loss)
- Total weight by metal
- Historical value chart
- Quick actions

### Collection
- List all items with photos
- Melt value and gain/loss per item
- Edit and delete actions
- Sort by purchase date

### Add/Edit Item
- Photo capture/upload
- Metal type selector (Gold, Silver, Platinum)
- Weight, purity, purchase price inputs
- Purchase date and notes
- Form validation

## Design

The app follows the same color scheme as the web version:
- **Primary**: Warm orange/coral (#E76F51)
- **Secondary**: Light orange (#F4A261)
- **Background**: Warm white (#FFFBF8)
- **Text**: Dark brown (#2D1B1B)
- **Muted**: Light brown (#8B6B61)

## Troubleshooting

### "Failed to fetch prices"
- Check your API key in `app.json`
- Verify internet connection
- App will use cached prices if API fails

### "Database initialization failed"
- Clear app data and reinstall
- Check SQLite permissions

### Photos not working
- Grant camera/photo library permissions
- Check `app.json` plugins configuration

## Development

```bash
# Start with cache cleared
npm start -- --clear

# Run TypeScript type checking
npx tsc --noEmit

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

## License

MIT
