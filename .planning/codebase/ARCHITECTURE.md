# Architecture

**Analysis Date:** 2026-01-09

## Pattern Overview

**Overall:** Multi-Platform Application with Shared Backend

**Key Characteristics:**
- Web tier: Next.js 16 (React 19) full-stack SSR framework
- Mobile tier: Expo/React Native cross-platform iOS/Android
- Unified API: Next.js API routes serve both clients
- Data layer: PostgreSQL with Prisma ORM

## Layers

**Presentation Layer (Client-side):**
- Purpose: UI rendering and user interactions
- Contains: React components, navigation, state management
- Web location: `bullion-tracker/src/components/`, `bullion-tracker/src/app/`
- Mobile location: `bullion-tracker-mobile/src/screens/`, `bullion-tracker-mobile/src/components/`
- Depends on: Hook layer for data, utility layer for formatting
- Used by: End users

**Hook Layer (Data Fetching):**
- Purpose: Encapsulate data fetching and caching logic
- Contains: Custom React hooks using TanStack Query
- Location: `bullion-tracker/src/hooks/`
- Depends on: API routes via fetch
- Used by: Presentation components

**API Layer (Server-side):**
- Purpose: REST endpoints, business logic execution
- Contains: Next.js API route handlers
- Location: `bullion-tracker/src/app/api/`
- Depends on: Service layer, database layer
- Used by: Web and mobile clients

**Service Layer:**
- Purpose: Business logic, calculations, external API calls
- Contains: Price fetching, portfolio calculations, authentication
- Location: `bullion-tracker/src/lib/`
- Depends on: Database layer, external APIs
- Used by: API routes

**Data Layer:**
- Purpose: Database access and persistence
- Contains: Prisma client, schema definitions
- Location: `bullion-tracker/src/lib/db.ts`, `bullion-tracker/prisma/schema.prisma`
- Depends on: PostgreSQL database
- Used by: Service layer

## Data Flow

**Web App Request Lifecycle:**

1. User interacts with page (`bullion-tracker/src/app/page.tsx`)
2. React hook triggers (`bullion-tracker/src/hooks/useCollection.ts`)
3. TanStack Query makes API request
4. API route processes request (`bullion-tracker/src/app/api/collection/route.ts`)
5. Service functions execute logic (`bullion-tracker/src/lib/calculations.ts`)
6. Prisma queries database (`bullion-tracker/src/lib/db.ts`)
7. Response flows back through layers
8. React Query caches and UI updates

**Mobile App Request Lifecycle:**

1. Screen mounts (`bullion-tracker-mobile/src/screens/DashboardScreen.tsx`)
2. API client makes request (`bullion-tracker-mobile/src/lib/api.ts`)
3. Request includes auth token from SecureStore
4. Same API routes process request
5. Response cached in AsyncStorage
6. UI updates with data

**State Management:**
- Web: React Query cache (1-minute stale time) + component local state
- Mobile: AuthContext for auth state, AsyncStorage for persistence
- No centralized state management (Redux, Zustand, etc.)

## Key Abstractions

**CollectionItem:**
- Purpose: Core data entity for bullion and numismatic coins
- Examples: Gold bars, silver coins, graded numismatic coins
- Pattern: Prisma model with relations to Images, CoinReference
- Location: `bullion-tracker/prisma/schema.prisma`

**SpotPrice:**
- Purpose: Current metal prices with caching
- Examples: Gold, Silver, Platinum prices in USD
- Pattern: In-memory cache with database fallback
- Location: `bullion-tracker/src/lib/prices.ts`

**User:**
- Purpose: Authentication and ownership
- Pattern: NextAuth user model with Prisma adapter
- Location: `bullion-tracker/src/auth.ts`

**Dual-Value System:**
- Purpose: Track both melt value and book value
- Melt Value: Raw metal value at spot price
- Book Value: User-defined with smart tracking (30% threshold rule)
- Location: `bullion-tracker/src/lib/calculations.ts`

## Entry Points

**Web App:**
- Root layout: `bullion-tracker/src/app/layout.tsx`
- Main dashboard: `bullion-tracker/src/app/page.tsx`
- Triggers: Browser navigation to /
- Responsibilities: Render dashboard, load user collection

**Mobile App:**
- Entry: `bullion-tracker-mobile/index.ts` (registerRootComponent)
- Root: `bullion-tracker-mobile/App.tsx` (Navigation setup)
- Triggers: App launch
- Responsibilities: Initialize auth, route to appropriate screen

**API Routes:**
- Location: `bullion-tracker/src/app/api/**/*.ts`
- Triggers: HTTP requests from clients
- Responsibilities: Process requests, return JSON responses

## Error Handling

**Strategy:** Try-catch at API boundary, error responses with status codes

**Patterns:**
- API routes wrap logic in try-catch
- Return `{ success: false, error: message }` on failure
- HTTP status codes: 400 (bad request), 401 (unauthorized), 500 (server error)
- Console.error for server-side logging

**Examples:**
- `bullion-tracker/src/app/api/collection/route.ts`: Returns JSON error with status
- `bullion-tracker-mobile/src/lib/api.ts`: Catches and returns user-friendly messages

## Cross-Cutting Concerns

**Logging:**
- Console.log/console.error (no structured logging)
- No request IDs or audit trails

**Validation:**
- Prisma schema constraints
- Manual validation in API routes (password length, email format)
- No validation library (Zod, Yup)

**Authentication:**
- NextAuth with JWT session strategy
- Mobile: Custom JWT with SecureStore
- Protected routes check session/token presence

**Caching:**
- React Query: 1-minute stale time for API responses
- Price cache: 8-hour TTL in memory
- Mobile: AsyncStorage for offline data

---

*Architecture analysis: 2026-01-09*
*Update when major patterns change*
