# Claude Code Prompt: Precious Metals Collection Tracker

## Project Overview

Build a full-stack web application for tracking a personal coin and bullion collection. This is a hobby project for a collector who wants to monitor their precious metals holdings alongside live market prices. The app should feel premium, clean, and be a joy to use.

## Tech Stack

**Frontend:**
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts or Chart.js for interactive graphs
- React Query (TanStack Query) for data fetching and caching

**Backend:**
- Next.js API routes (or separate FastAPI backend if preferred)
- PostgreSQL database with Prisma ORM
- Cloudinary or AWS S3 for image storage

**External APIs:**
- Use a free metals price API (options: Metals.live API, GoldAPI.io free tier, or scrape from trusted sources)
- Historical pricing data for charts

## Design System

### Color Palette
```
Primary Background: #FAFAFA (off-white)
Secondary Background: #F5F5F5 (light gray)
Card Background: #FFFFFF
Primary Accent: #4A6741 (muted sage green)
Secondary Accent: #6B8E63 (lighter green)
Success/Positive: #22C55E
Warning: #F59E0B
Text Primary: #1F2937
Text Secondary: #6B7280
Border: #E5E7EB
Gold Accent: #D4AF37
Silver Accent: #C0C0C0
Platinum Accent: #E5E4E2
```

### Typography
- Headings: Inter or SF Pro Display (clean, modern)
- Body: Inter or system-ui
- Monospace for prices: JetBrains Mono or SF Mono

### UI Principles
- Generous whitespace
- Subtle shadows (shadow-sm, shadow-md)
- Rounded corners (rounded-lg, rounded-xl)
- Micro-interactions on hover/focus
- Smooth transitions (150-300ms)
- Cards with subtle borders or shadows, not both

---

## Core Features - Detailed Specifications

### 1. Live Spot Price Ticker

**Location:** Fixed at top of page, always visible

**Display:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  🥇 GOLD $2,650.42 ▲ +1.2%   🥈 SILVER $31.85 ▲ +0.8%   🪙 PLATINUM $982.15 ▼ -0.3%  │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Show price per troy oz for Gold, Silver, Platinum
- Show 24h change ($ and %)
- Color-coded: green for up, red for down
- Subtle pulse animation when prices update
- Update every 60 seconds (configurable)
- Show last updated timestamp on hover
- Graceful fallback if API fails (show cached price with "stale" indicator)

**Implementation Notes:**
```typescript
interface SpotPrice {
  metal: 'gold' | 'silver' | 'platinum';
  pricePerOz: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: Date;
}
```

### 2. Collection Item Management

**Two Item Types:**

#### A. Itemized Coins/Bullion
```typescript
interface ItemizedPiece {
  id: string;
  type: 'itemized';
  title: string;                    // Required: "2021 Silver Eagle MS70"
  metal: 'gold' | 'silver' | 'platinum';  // Required
  quantity: number;                 // Required, default 1
  weightOz: number;                 // Required, weight per piece in troy oz
  grade?: string;                   // Optional: "MS70", "PF69", etc.
  gradingService?: string;          // Optional: "PCGS", "NGC", "ANACS", etc.
  notes?: string;                   // Optional
  images: string[];                 // Array of image URLs
  bookValueType: 'custom' | 'spot'; // How book value is calculated
  customBookValue?: number;         // If bookValueType is 'custom', per-piece value
  bookValueSnapshot?: number;       // The book value when item was added
  spotPriceAtCreation: number;      // Spot price when item was added (for ratio tracking)
  createdAt: Date;
  updatedAt: Date;
}
```

#### B. Bulk Weight Entry
```typescript
interface BulkWeight {
  id: string;
  type: 'bulk';
  metal: 'gold' | 'silver' | 'platinum';  // Required
  weightOz: number;                 // Required, total weight in troy oz
  notes?: string;                   // Optional: "Misc silver rounds", "Scrap gold"
  images: string[];
  bookValueType: 'custom' | 'spot';
  customBookValue?: number;
  bookValueSnapshot?: number;
  spotPriceAtCreation: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Add Item Modal/Form:**
- Tab switcher: "Add Coin/Bullion" | "Add by Weight"
- Clean form with proper validation
- Image upload with drag-and-drop
- Preview of calculated values before saving
- Book value selector:
  - Radio: "Use Spot Value" | "Custom Value"
  - If custom, show input field
  - Show calculated spot value for reference

### 3. Collection View

**Layout:** Grid of cards, responsive
- Desktop: 4-5 items per row
- Tablet: 3 items per row
- Mobile: 1-2 items per row

**Card (Collapsed State):**
```
┌──────────────────────────────┐
│  [Thumbnail Image]           │
│                              │
│  2021 Silver Eagle MS70      │
│  🥈 1 oz × 5 = 5 oz          │
│                              │
│  Melt: $159.25               │
│  Book: $175.00    ▲ +9.9%    │
└──────────────────────────────┘
```

**Card (Hover/Expanded State):**
Shows additional details:
- Grade & grading service
- Notes
- Date added
- Edit/Delete buttons
- Full-size image preview option

**Sorting & Filtering:**
- Sort by: Date added, Metal type, Value (melt), Value (book), Weight
- Filter by: Metal type, Grading service

**Summary Bar:**
```
Total Holdings: 156.5 oz Silver | 2.5 oz Gold | 1 oz Platinum
Total Melt Value: $7,842.50  |  Total Book Value: $8,950.00
```

### 4. Image Management

**Requirements:**
- Support multiple images per item
- First image is primary/thumbnail
- Drag to reorder
- Click to view full-size in lightbox
- Compress images on upload (client-side)
- Accept: JPG, PNG, WebP
- Max size: 10MB per image

### 5. Dynamic Book Value Tracking

**The Formula:**

When `bookValueType === 'custom'`:
```typescript
// At creation:
bookValueSnapshot = customBookValue;
spotPriceAtCreation = currentSpotPrice;
initialRatio = bookValueSnapshot / (weightOz * quantity * spotPriceAtCreation);

// At display time:
currentMeltValue = weightOz * quantity * currentSpotPrice;
percentDifference = Math.abs((bookValueSnapshot - (weightOz * quantity * spotPriceAtCreation)) / (weightOz * quantity * spotPriceAtCreation));

if (percentDifference <= 0.30) {
  // Book value tracks with spot
  currentBookValue = bookValueSnapshot * (currentSpotPrice / spotPriceAtCreation);
} else {
  // Book value is fixed (too far from spot to track)
  currentBookValue = bookValueSnapshot;
}
```

**Example:**
- Morgan Dollar added: Book $50, Melt $45 (11% difference, within 30%)
- Spot goes up 20%: New melt = $54, New book = $60 (also up 20%)
- Numismatic coin: Book $500, Melt $45 (1000% difference, outside 30%)
- Spot goes up 20%: New melt = $54, Book stays $500

### 6. Interactive Value Chart

**Location:** Below spot prices, above collection grid

**Requirements:**
- Dual-line chart: Melt Value (solid) vs Book Value (dashed)
- Time range selector: 24H | 1W | 1M | 1Y | 5Y
- Hover shows exact values at point in time
- Smooth animations on data change
- Legend with current totals
- Responsive sizing

**Data Structure:**
```typescript
interface PortfolioSnapshot {
  timestamp: Date;
  totalMeltValue: number;
  totalBookValue: number;
  goldOz: number;
  silverOz: number;
  platinumOz: number;
  goldPrice: number;
  silverPrice: number;
  platinumPrice: number;
}
```

**Historical Data Strategy:**
- Store daily snapshots of portfolio value
- For historical spot prices, use a historical data API or maintain a price history table
- Calculate historical values by replaying collection state against historical prices
- For "what if" historical data before user started tracking: Use current holdings × historical prices

### 7. Collection Collage

**Location:** Separate tab/page or modal

**Requirements:**
- Masonry or grid layout of all item images
- Click any image to see item details
- Download collage as image option
- Filter by metal type
- Randomize order option
- Beautiful, Pinterest-style presentation

---

## Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  items     CollectionItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CollectionItem {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  
  type                String   // 'itemized' | 'bulk'
  title               String?  // For itemized only
  metal               String   // 'gold' | 'silver' | 'platinum'
  quantity            Int      @default(1)
  weightOz            Float
  grade               String?
  gradingService      String?
  notes               String?
  
  images              Image[]
  
  bookValueType       String   // 'custom' | 'spot'
  customBookValue     Float?
  spotPriceAtCreation Float
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Image {
  id        String   @id @default(cuid())
  url       String
  itemId    String
  item      CollectionItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  order     Int      @default(0)
  createdAt DateTime @default(now())
}

model PriceHistory {
  id        String   @id @default(cuid())
  metal     String
  priceOz   Float
  timestamp DateTime
  
  @@index([metal, timestamp])
}

model PortfolioSnapshot {
  id             String   @id @default(cuid())
  userId         String
  timestamp      DateTime
  totalMeltValue Float
  totalBookValue Float
  goldOz         Float
  silverOz       Float
  platinumOz     Float
  goldPrice      Float
  silverPrice    Float
  platinumPrice  Float
  
  @@index([userId, timestamp])
}
```

---

## API Routes

```
GET    /api/prices              - Get current spot prices
GET    /api/prices/history      - Get historical prices (query: metal, start, end)

GET    /api/collection          - Get all items
POST   /api/collection          - Add new item
GET    /api/collection/:id      - Get single item
PUT    /api/collection/:id      - Update item
DELETE /api/collection/:id      - Delete item

POST   /api/images/upload       - Upload image, returns URL
DELETE /api/images/:id          - Delete image

GET    /api/portfolio/summary   - Get totals and breakdown
GET    /api/portfolio/history   - Get portfolio value over time
```

---

## Component Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Dashboard
│   ├── collage/
│   │   └── page.tsx
│   └── api/
│       ├── prices/
│       ├── collection/
│       ├── images/
│       └── portfolio/
├── components/
│   ├── ui/                      # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── SpotPriceTicker.tsx
│   │   └── Navigation.tsx
│   ├── collection/
│   │   ├── CollectionGrid.tsx
│   │   ├── CollectionCard.tsx
│   │   ├── AddItemModal.tsx
│   │   ├── ItemizedForm.tsx
│   │   ├── BulkWeightForm.tsx
│   │   ├── ImageUploader.tsx
│   │   └── CollectionSummary.tsx
│   ├── charts/
│   │   ├── PortfolioChart.tsx
│   │   └── TimeRangeSelector.tsx
│   └── collage/
│       └── CollageView.tsx
├── hooks/
│   ├── useSpotPrices.ts
│   ├── useCollection.ts
│   ├── usePortfolioHistory.ts
│   └── useImageUpload.ts
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── prices.ts                # Price fetching logic
│   ├── calculations.ts          # Value calculations
│   └── utils.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

---

## Key Implementation Details

### Spot Price Polling
```typescript
// hooks/useSpotPrices.ts
export function useSpotPrices() {
  return useQuery({
    queryKey: ['spotPrices'],
    queryFn: fetchSpotPrices,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
    retry: 3,
  });
}
```

### Book Value Calculation
```typescript
// lib/calculations.ts
export function calculateCurrentBookValue(item: CollectionItem, currentSpotPrice: number): number {
  const totalWeight = item.weightOz * item.quantity;
  const originalMelt = totalWeight * item.spotPriceAtCreation;
  
  if (item.bookValueType === 'spot') {
    return totalWeight * currentSpotPrice;
  }
  
  const customValue = item.customBookValue!;
  const percentDiff = Math.abs((customValue - originalMelt) / originalMelt);
  
  if (percentDiff <= 0.30) {
    // Track with spot price movement
    const priceRatio = currentSpotPrice / item.spotPriceAtCreation;
    return customValue * priceRatio;
  }
  
  // Fixed book value
  return customValue;
}
```

### Image Upload with Preview
```typescript
// components/collection/ImageUploader.tsx
// Use react-dropzone
// Compress with browser-image-compression before upload
// Show thumbnails with drag-to-reorder using @dnd-kit/sortable
```

---

## Iteration-Friendly Architecture

1. **Feature Flags:** Use a simple config object for toggling features
2. **Component Isolation:** Each feature is self-contained
3. **API Versioning:** Prefix routes with /api/v1/ for future changes
4. **Type Safety:** Full TypeScript with strict mode
5. **Env Variables:** All configurable values in .env
6. **Documentation:** JSDoc comments on complex functions

---

## Getting Started Commands

```bash
# Initialize project
npx create-next-app@latest coin-tracker --typescript --tailwind --app --src-dir

# Install dependencies
npm install @prisma/client @tanstack/react-query recharts framer-motion
npm install react-dropzone browser-image-compression @dnd-kit/core @dnd-kit/sortable
npm install -D prisma

# Setup database
npx prisma init
npx prisma db push
npx prisma generate

# Run development
npm run dev
```

---

## Nice-to-Have Future Features (Don't build yet, but architect for them)

- Export collection to CSV/PDF
- Mobile app (React Native)
- Price alerts
- Purchase history tracking (when/where bought)
- Profit/loss calculations
- Multiple portfolios
- Sharing/public profile
- Barcode/QR scanning for coins
- Integration with coin databases (PCGS, NGC) for auto-fill

---

## Success Criteria

1. ✅ Spot prices load and update every minute
2. ✅ Can add itemized coins with all fields
3. ✅ Can add bulk weight entries
4. ✅ Images upload and display correctly
5. ✅ Collection grid shows all items with hover details
6. ✅ Book values track correctly (within 30% threshold)
7. ✅ Chart displays historical portfolio value
8. ✅ Collage view shows all images beautifully
9. ✅ UI is clean, fast, and delightful
10. ✅ Code is well-organized and documented

---

Start by building the core data models and API routes, then the spot price ticker, then the collection CRUD, then the charts. This order ensures you always have something working to show.
