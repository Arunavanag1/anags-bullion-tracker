# Codebase Structure

**Analysis Date:** 2026-01-09

## Directory Layout

```
bullion_collection_tracker/
├── bullion-tracker/              # Next.js web application
│   ├── prisma/                   # Database schema and migrations
│   │   ├── schema.prisma         # Prisma schema
│   │   └── migrations/           # Database migrations
│   ├── scripts/                  # Utility scripts
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── api/              # API routes
│   │   │   ├── auth/             # Auth pages (signin, signup)
│   │   │   ├── collage/          # Collage display page
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── page.tsx          # Main dashboard
│   │   │   └── globals.css       # Global styles
│   │   ├── components/           # React components
│   │   │   ├── auth/             # Auth components
│   │   │   ├── charts/           # Chart components
│   │   │   ├── collection/       # Collection management
│   │   │   ├── collage/          # Collage components
│   │   │   ├── layout/           # Layout components
│   │   │   ├── numismatic/       # Numismatic coin components
│   │   │   ├── ui/               # UI primitives
│   │   │   ├── Providers.tsx     # Context providers
│   │   │   └── TopPerformers.tsx # Top performers widget
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility functions and services
│   │   │   └── plaid/            # Plaid/OAuth integration
│   │   └── types/                # TypeScript type definitions
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── next.config.ts            # Next.js config
│   └── eslint.config.mjs         # ESLint config
│
├── bullion-tracker-mobile/       # React Native mobile app
│   ├── src/
│   │   ├── components/           # React Native components
│   │   │   ├── ui/               # UI primitives
│   │   │   └── numismatic/       # Numismatic components
│   │   ├── contexts/             # React contexts
│   │   │   └── AuthContext.tsx   # Auth state management
│   │   ├── screens/              # Navigation screens
│   │   ├── hooks/                # Custom hooks
│   │   ├── lib/                  # Utilities and API client
│   │   ├── types/                # TypeScript definitions
│   │   └── data/                 # Static data files
│   ├── assets/                   # Images, fonts
│   ├── App.tsx                   # Root navigation
│   ├── index.ts                  # Entry point
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   └── tailwind.config.js        # Tailwind (NativeWind) config
│
└── .planning/                    # Planning documents
    └── codebase/                 # Codebase analysis docs
```

## Directory Purposes

**bullion-tracker/prisma/**
- Purpose: Database schema and migrations
- Contains: `schema.prisma`, migration files
- Key files: `schema.prisma` - Prisma data model

**bullion-tracker/src/app/api/**
- Purpose: Backend API endpoints
- Contains: Route handlers (route.ts files)
- Key locations:
  - `api/collection/` - Collection CRUD
  - `api/prices/` - Spot prices
  - `api/coins/` - Numismatic data
  - `api/auth/` - Authentication
  - `api/oauth/` - OAuth integration
  - `api/fdx/` - FDX/Plaid integration

**bullion-tracker/src/components/**
- Purpose: React UI components
- Contains: TSX component files
- Subdirectories:
  - `ui/` - Button, Card, Input, Modal primitives
  - `collection/` - CollectionGrid, AddItemModal, EditItemModal
  - `charts/` - AllocationDonutChart, PortfolioChart
  - `numismatic/` - CategoryBadge, ConfidenceIndicator

**bullion-tracker/src/hooks/**
- Purpose: Custom React hooks for data fetching
- Contains: Hook files using TanStack Query
- Key files: `useSpotPrices.ts`, `useCollection.ts`, `usePortfolioSummary.ts`

**bullion-tracker/src/lib/**
- Purpose: Business logic and utilities
- Contains: Service functions
- Key files:
  - `db.ts` - Prisma client initialization
  - `auth.ts` - NextAuth configuration
  - `prices.ts` - Spot price fetching and caching
  - `calculations.ts` - Value calculations

**bullion-tracker-mobile/src/screens/**
- Purpose: Navigation screens (pages)
- Contains: Screen components
- Key files: `DashboardScreen.tsx`, `CollectionScreen.tsx`, `AddItemScreen.tsx`

**bullion-tracker-mobile/src/contexts/**
- Purpose: React context providers
- Contains: `AuthContext.tsx` for auth state

## Key File Locations

**Entry Points:**
- `bullion-tracker/src/app/layout.tsx` - Web root layout
- `bullion-tracker/src/app/page.tsx` - Main dashboard
- `bullion-tracker-mobile/index.ts` - Mobile entry
- `bullion-tracker-mobile/App.tsx` - Mobile navigation

**Configuration:**
- `bullion-tracker/tsconfig.json` - TypeScript config
- `bullion-tracker/next.config.ts` - Next.js config
- `bullion-tracker/eslint.config.mjs` - ESLint
- `bullion-tracker/.env` - Environment variables
- `bullion-tracker/prisma/schema.prisma` - Database schema

**Core Logic:**
- `bullion-tracker/src/lib/prices.ts` - Price fetching
- `bullion-tracker/src/lib/calculations.ts` - Value calculations
- `bullion-tracker/src/lib/db.ts` - Database client
- `bullion-tracker/src/auth.ts` - Auth configuration

**API Routes:**
- `bullion-tracker/src/app/api/collection/route.ts` - Collection CRUD
- `bullion-tracker/src/app/api/prices/route.ts` - Spot prices
- `bullion-tracker/src/app/api/auth/signup/route.ts` - Registration

**Testing:**
- No test files present

## Naming Conventions

**Files:**
- PascalCase.tsx: React components (`Button.tsx`, `AddItemModal.tsx`)
- camelCase.ts: Hooks and utilities (`useSpotPrices.ts`, `prices.ts`)
- route.ts: API route handlers
- kebab-case: Directory names in URLs

**Directories:**
- Plural names for collections: `components/`, `hooks/`, `screens/`
- Domain-based grouping: `collection/`, `numismatic/`, `auth/`

**Special Patterns:**
- `[param]`: Dynamic route segments (`[id]/route.ts`)
- `[...param]`: Catch-all routes (`[...nextauth]/route.ts`)
- `index.ts`: Type exports in types directory

## Where to Add New Code

**New Feature:**
- Primary code: `bullion-tracker/src/components/{feature}/`
- API routes: `bullion-tracker/src/app/api/{feature}/route.ts`
- Hooks: `bullion-tracker/src/hooks/use{Feature}.ts`
- Types: `bullion-tracker/src/types/index.ts`

**New Component:**
- UI primitive: `bullion-tracker/src/components/ui/{ComponentName}.tsx`
- Feature component: `bullion-tracker/src/components/{domain}/{ComponentName}.tsx`
- Mobile: `bullion-tracker-mobile/src/components/{ComponentName}.tsx`

**New API Route:**
- Definition: `bullion-tracker/src/app/api/{resource}/route.ts`
- Dynamic: `bullion-tracker/src/app/api/{resource}/[id]/route.ts`

**New Screen (Mobile):**
- Location: `bullion-tracker-mobile/src/screens/{ScreenName}Screen.tsx`
- Navigation: Update `bullion-tracker-mobile/App.tsx`

**Utilities:**
- Shared helpers: `bullion-tracker/src/lib/{utility}.ts`
- Type definitions: `bullion-tracker/src/types/index.ts`

## Special Directories

**bullion-tracker/.next/**
- Purpose: Next.js build output
- Source: Auto-generated by Next.js build
- Committed: No (gitignored)

**bullion-tracker/node_modules/**
- Purpose: NPM dependencies
- Source: Installed by npm install
- Committed: No (gitignored)

**.planning/codebase/**
- Purpose: Codebase analysis documents
- Source: Generated by /gsd:map-codebase
- Committed: Yes

---

*Structure analysis: 2026-01-09*
*Update when directory structure changes*
