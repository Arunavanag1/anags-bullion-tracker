# Bullion Collection Tracker

A modern web application for tracking your precious metals collection with live spot prices. Built with Next.js, TypeScript, Prisma, and Tailwind CSS.

## Features

- **Live Spot Prices**: Real-time gold, silver, and platinum prices with 24h change tracking
- **Collection Management**: Add and track both itemized coins/bullion and bulk weight entries
- **Dynamic Book Value Tracking**: Intelligent book value calculation that tracks with spot prices when appropriate
- **Beautiful UI**: Clean, modern design with custom color palette and smooth animations
- **Portfolio Summary**: Overview of total holdings by metal type and value

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query)
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Animations**: Framer Motion (ready to use)
- **Image Handling**: React Dropzone, Browser Image Compression (ready to use)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use `npx prisma dev` for local development)

### Installation

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up database**:

   Option A: Use Prisma's local development database (easiest):
   ```bash
   npx prisma dev
   ```

   Option B: Use your own PostgreSQL database:
   - Update the `DATABASE_URL` in `.env` file
   - Run migrations:
     ```bash
     npx prisma db push
     npx prisma generate
     ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

The `.env` file contains the following configuration:

```env
# Database (required)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bullion_tracker?schema=public"

# External API Keys (optional - app uses mock data by default)
METALS_API_KEY=""

# Image Upload (optional - not yet implemented)
NEXT_PUBLIC_UPLOAD_ENABLED="false"
```

## How It Works

### Book Value Tracking

The app implements a smart book value tracking system:

1. **Spot Value**: Book value equals melt value (weight × spot price)
2. **Custom Value with Tracking**: If custom book value is within 30% of melt value, it tracks with spot price movements
3. **Fixed Custom Value**: If custom book value is >30% different from melt value, it remains fixed (e.g., numismatic coins)

### Spot Prices

Currently using mock data with realistic fluctuations. To integrate real prices:

1. Get an API key from [Metals.live](https://metals.live) or [GoldAPI.io](https://goldapi.io)
2. Add it to `.env` as `METALS_API_KEY`
3. Update the `fetchSpotPrices()` function in `src/lib/prices.ts`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Regenerate Prisma client

## Future Enhancements

Planned features for future versions:

- Image upload and management
- Historical portfolio value charts
- Collection collage view
- CSV/PDF export
- Price alerts
- Purchase history tracking
- Multi-user authentication
- Mobile app (React Native)

## Color Palette

The app uses a custom, premium color scheme:

- Primary Background: `#FAFAFA`
- Card Background: `#FFFFFF`
- Primary Accent: `#4A6741` (sage green)
- Gold Accent: `#D4AF37`
- Silver Accent: `#C0C0C0`
- Platinum Accent: `#E5E4E2`

---

Built with ❤️ for precious metals collectors
