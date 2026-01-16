# Bullion Collection Tracker

## Overview

A premium bullion and numismatic coin collection tracker with web and mobile apps. Features real-time spot prices, portfolio valuation with multiple methods (spot+premium, guide price, custom), interactive radial photo gallery, and comprehensive collection management.

## Technology Stack

| Layer | Web | Mobile |
|-------|-----|--------|
| Framework | Next.js 16.1 | Expo ~54 / React Native 0.81 |
| UI | React 19, Tailwind CSS 4 | React Native, NativeWind |
| Charts | Recharts 3.6 | Victory Native |
| Animation | Framer Motion, GSAP | Reanimated, Gesture Handler |
| Data | TanStack Query | AsyncStorage + API |
| Auth | NextAuth 5 (beta) | Custom JWT + SecureStore |
| Database | PostgreSQL + Prisma 7 | Connects to same API |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Clients                                 │
├─────────────────────────────┬───────────────────────────────┤
│     Web (Next.js)           │      Mobile (Expo)            │
│  - Server-side rendering    │  - Native iOS/Android         │
│  - React Query caching      │  - SecureStore for tokens     │
│  - GSAP animations          │  - Reanimated animations      │
└─────────────────────────────┴───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  /api/collection  /api/prices  /api/coins  /api/auth        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (lib/)                       │
│  calculations.ts  prices.ts  auth.ts  db.ts                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL (via Prisma)                       │
│  Users  CollectionItems  CoinReferences  SpotPrices         │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
bullion_collection_tracker/
├── bullion-tracker/                 # Next.js web app
│   ├── prisma/schema.prisma         # Database schema
│   ├── src/
│   │   ├── app/                     # Pages & API routes
│   │   │   ├── api/                 # REST endpoints
│   │   │   ├── collage/             # Photo gallery page
│   │   │   └── page.tsx             # Dashboard
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Data fetching hooks
│   │   └── lib/                     # Business logic
│   └── package.json
│
├── bullion-tracker-mobile/          # React Native app
│   ├── src/
│   │   ├── screens/                 # App screens
│   │   ├── components/              # UI components
│   │   ├── contexts/                # State management
│   │   └── lib/                     # API client & utilities
│   └── package.json
│
└── .planning/                       # Project documentation
```

## Key Features

### Portfolio Valuation
- **Bullion**: Spot price × weight × (1 + premium%)
- **Numismatic**: Guide price from PCGS/NGC or custom value
- **Daily tracking**: Logs prices for 24h gain calculation

### Collection Management
- Add/edit items with images, grades, weights
- Category badges (Bullion/Numismatic)
- Problem coin tracking (cleaned, damaged, etc.)
- Multi-image support with lightbox viewer

### Visualizations
- Interactive radial photo gallery (web)
- Portfolio allocation pie chart
- Gain/loss bar chart by metal
- Historical price charts with date range picker

### Mobile Features
- Expandable spot price banner with daily changes
- Compact currency formatting ($12.3k)
- Pull-to-refresh data sync
- Secure token storage

## Data Models

### CollectionItem
```typescript
{
  id: string
  userId: string
  title: string
  metal: 'gold' | 'silver' | 'platinum'
  category: 'BULLION' | 'NUMISMATIC'
  weightOz: number
  quantity: number
  bookValueType: 'spot_premium' | 'guide_price' | 'custom'
  premiumPercent?: number      // For bullion
  numismaticValue?: number     // Guide price
  customBookValue?: number     // Fixed custom value
  purchasePrice?: number       // Cost basis
  spotPriceAtCreation?: number // For bullion cost basis
  grade?: string
  gradingService?: 'PCGS' | 'NGC' | 'RAW'
  images: string[]
}
```

### SpotPrices
```typescript
{
  gold: number      // USD per oz
  silver: number
  platinum: number
  lastUpdated: string
}
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# External APIs
METAL_PRICE_API_KEY="..."

# Image Storage
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

## Running Locally

```bash
# Web app
cd bullion-tracker
npm install
npm run dev          # http://localhost:3000

# Mobile app
cd bullion-tracker-mobile
npm install
npx expo start       # Scan QR with Expo Go
```

## Current Status

**Completed (v1.0 - v1.7):**
- Radial photo gallery
- Security hardening & rate limiting
- Cloud image storage (Cloudinary)
- Chart improvements & export
- Mobile refactoring
- Portfolio valuation model (premium, guide price, custom)
- Unified portfolio display

**In Progress (v1.8):**
- Mobile radial collage
- Device testing & bug fixes
- App store preparation

## Known Limitations

1. **No test coverage** - Testing framework not set up
2. **No email verification** - Users register with any email
3. **No password reset** - Manual intervention required
4. **Beta auth library** - next-auth 5.0.0-beta may have breaking changes

---
*Last updated: 2026-01-16*
