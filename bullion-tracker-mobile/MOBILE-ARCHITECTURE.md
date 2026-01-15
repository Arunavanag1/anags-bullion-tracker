# Mobile App Architecture

## Overview

The Bullion Tracker mobile app is a React Native/Expo application for tracking precious metals collections. It provides portfolio management, numismatic coin tracking, and price monitoring capabilities.

**Tech Stack:**
- React Native 0.81.5 with Expo SDK 54
- TypeScript 5.9
- React Navigation 7.x (native-stack)
- NativeWind (Tailwind CSS for React Native)
- Victory Native for charts
- Axios for HTTP requests
- Fuse.js for fuzzy search

## Directory Structure

```
bullion-tracker-mobile/
├── App.tsx                    # Entry point, navigation setup, auth flow
├── index.ts                   # Expo entry point
├── app.json                   # Expo config (API URL in extra)
├── package.json               # Dependencies
├── tailwind.config.js         # NativeWind configuration
└── src/
    ├── components/            # Reusable UI components
    │   ├── ui/                # Generic UI primitives (Button, Card, Input)
    │   ├── numismatic/        # Coin-specific components
    │   ├── AllocationDonutChart.tsx
    │   ├── PortfolioChart.tsx
    │   └── TopPerformers.tsx
    ├── contexts/              # React contexts for global state
    │   └── AuthContext.tsx    # Authentication state management
    ├── data/                  # Static data files
    │   └── historical-prices.json
    ├── hooks/                 # Custom React hooks
    │   └── useCoins.ts        # Coin search, price guide hooks
    ├── lib/                   # Utility functions and services
    │   ├── api.ts             # API client, auth, collection CRUD
    │   ├── calculations.ts    # Portfolio value calculations
    │   ├── colors.ts          # Design system color constants
    │   ├── historical-data.ts # Historical price interpolation
    │   └── prices.ts          # Spot price fetching with caching
    ├── screens/               # Screen components
    │   ├── AddItemScreen.tsx
    │   ├── CollageScreen.tsx
    │   ├── CollectionScreen.tsx
    │   ├── DashboardScreen.tsx
    │   ├── LoginScreen.tsx
    │   └── RegisterScreen.tsx
    └── types/                 # TypeScript type definitions
        └── index.ts
```

## Screens

| Screen | Purpose | Key Features | Lines |
|--------|---------|--------------|-------|
| DashboardScreen | Main portfolio view | Spot prices banner, portfolio summary, charts, top performers | 755 |
| CollectionScreen | Item list view | Filterable list, search, item cards with value display | 666 |
| AddItemScreen | Create new items | Multi-step form (category, grading, details), bullion/numismatic support | 776 |
| CollageScreen | Photo gallery | Grid of collection photos | 342 |
| LoginScreen | User authentication | Email/password sign in | 120 |
| RegisterScreen | User registration | Name, email, password form | 178 |

## Components

### Shared Components (src/components/)

| Component | Purpose | Lines |
|-----------|---------|-------|
| ui/Button | Styled button with variants (primary, secondary, ghost, danger) | 143 |
| ui/Card | Container with shadow and border radius | 31 |
| ui/Input | Text input with label and error support | 53 |
| PortfolioChart | Historical value chart with time range selector | 270 |
| TopPerformers | Best/worst performing metals display | 328 |
| AllocationDonutChart | SVG donut chart for allocation breakdown | 101 |

### Numismatic Components (src/components/numismatic/)

| Component | Purpose | Lines |
|-----------|---------|-------|
| CoinSearchInput | Fuzzy search with autocomplete dropdown | 171 |
| GradePicker | Grade selection dropdown | ~80 |
| PriceGuideDisplay | Price guide value with confidence indicator | ~100 |
| CategoryBadge | Category label badge | ~30 |
| ConfidenceIndicator | Price confidence level indicator | ~40 |
| ProblemCoinBadge | Problem coin warning badge | ~30 |

### Screen-Specific Components (Inline)

Several components are defined inline within screen files and duplicated across screens:

| Component | Defined In | Description |
|-----------|------------|-------------|
| PricePill | DashboardScreen:694, CollectionScreen:591, CollageScreen:159 | Spot price display pill |
| TabButton | DashboardScreen:714, CollectionScreen:605, CollageScreen:169 | Bottom navigation tab |
| ToggleButton | DashboardScreen:730 | Toggle button variant |
| FilterChip | CollectionScreen:565 | Filter chip button |

## State Management

**Current Approach:** Minimal global state with Context API + local useState

### AuthContext (src/contexts/AuthContext.tsx)
- Single context providing: user, token, isLoading, signIn, signUp, signOut
- Token stored in expo-secure-store (3-second timeout fallback)
- Automatic token restoration on app start

### Local State Patterns
- Each screen manages its own data fetching and loading states
- Uses useState + useEffect for data loading
- Manual refresh via pull-to-refresh or navigation focus events

**Data Flow:**
```
API (backend)
    ↓ (fetch on mount/focus)
Screen State (useState)
    ↓ (props)
Child Components
```

## API Layer

### Core API Client (src/lib/api.ts - 434 lines)

**Request Pattern:**
```typescript
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response>
```
- Automatically injects auth token from SecureStore
- 10-second timeout with AbortController
- JSON content type by default

**Configuration:**
- API URL from `Constants.expoConfig.extra.apiUrl` (app.json)
- Falls back to localhost:3001 in development

**Exported Methods:**
- `api.getCollectionItems()` - Fetch all items
- `api.getCollectionItem(id)` - Fetch single item
- `api.createCollectionItem(data)` - Create item
- `api.updateCollectionItem(id, data)` - Update item
- `api.deleteCollectionItem(id)` - Delete item
- `api.searchCoins(query)` - Search coin references
- `api.getPriceGuide(coinId, grade)` - Get price guide
- `api.getGrades()` - Get valid grades
- `api.getCollectionSummary()` - Get summary stats
- `api.getMetalPerformance()` - Get metal performance data
- `api.getCoinPerformance()` - Get coin performance data
- `syncCoinsCache()` - Sync coins for offline
- `clearOldPriceCaches()` - Clear stale price caches

### Caching Strategy
- Coins cache: AsyncStorage, synced on app start
- Price guide cache: 1 hour TTL
- Grades cache: Indefinite (rarely changes)
- Spot prices: 12 hours TTL (in prices.ts)

## Patterns in Use

### Good Patterns to Preserve

1. **Centralized API Client** - All API calls go through api.ts with consistent error handling
2. **Typed Props** - Components use TypeScript interfaces for props
3. **Custom Hooks** - useCoins.ts provides reusable data fetching hooks with debouncing
4. **Offline Support** - Coin cache with Fuse.js fuzzy search fallback
5. **Design System** - Centralized colors in colors.ts
6. **Pure Calculations** - Business logic in calculations.ts (testable)
7. **Error Retry Logic** - Prices API has error timestamp tracking to avoid spam

### Navigation Pattern
- React Navigation native-stack
- Conditional stack based on auth state (AuthStack vs MainStack)
- Screen focus event listeners for data refresh

### Styling Pattern
- Mix of NativeWind (className) and StyleSheet.create
- Inline styles in some components
- Colors imported from lib/colors.ts

## Anti-Patterns Found

### Large Files Needing Refactoring

| File | Lines | Issue | Suggested Action |
|------|-------|-------|------------------|
| AddItemScreen.tsx | 776 | Form logic, validation, multiple render functions, 180 lines of styles | Split into separate form step components |
| DashboardScreen.tsx | 755 | Multiple inline components, 340+ lines of styles | Extract PricePill, TabButton; move styles |
| CollectionScreen.tsx | 666 | Duplicated components from Dashboard, 200+ lines of styles | Share components with Dashboard |
| api.ts | 434 | Mixed concerns (types, caching, API calls) | Consider splitting into modules |
| CollageScreen.tsx | 342 | Duplicates PricePill, TabButton from other screens | Share components |
| TopPerformers.tsx | 328 | Large but acceptable; could extract PerformanceRow | Optional |

### Duplicated Components

| Component | Locations | Lines Per Instance |
|-----------|-----------|-------------------|
| PricePill | DashboardScreen:694-707, CollectionScreen:591-602, CollageScreen:159-167 | ~13 |
| TabButton | DashboardScreen:714-730, CollectionScreen:605-621, CollageScreen:169-185 | ~16 |

**Impact:** ~60 lines of duplicated code across 3 files

### Inline Styles

| File | Lines of Styles | Issue |
|------|-----------------|-------|
| DashboardScreen.tsx | 340-755 (415 lines) | 55% of file is StyleSheet |
| CollectionScreen.tsx | 467-666 (199 lines) | 30% of file is StyleSheet |
| AddItemScreen.tsx | 597-776 (179 lines) | 23% of file is StyleSheet |
| CollageScreen.tsx | 187-342 (155 lines) | 45% of file is StyleSheet |

### Missing Types

| Location | Issue |
|----------|-------|
| useCollectionSummary.ts:106 | Returns `any` instead of typed CollectionSummary |
| api.ts:170 | Fuse.search result cast as `any` |
| api.ts:334-337, 350-352, 369-371, 387-390 | Image mapping uses `any` |

### Prop Drilling

| Screen | Props Passed | Alternative |
|--------|-------------|-------------|
| DashboardScreen | spotPrices, items passed through multiple levels | Consider context or composition |
| CollectionScreen | spotPrices passed to item rendering functions | Consider context |

### Hardcoded Values

| Location | Value | Should Be |
|----------|-------|-----------|
| prices.ts:79-85 | Fallback prices (gold: 4500, silver: 78, platinum: 2400) | Config constant |
| api.ts:17 | Localhost fallback URL | Already configurable via app.json |
| RegisterScreen.tsx:29 | Password min length = 6 | Should match backend (8+) |

### Missing Error Boundaries
- No error boundaries around screen components
- API errors handled but may not display gracefully in all cases

## Refactoring Priorities for Phases 18-20

### Phase 18: State Management Refactor (High Priority)

1. **Extract shared UI components** - Move PricePill, TabButton to src/components/ui/
   - Files: DashboardScreen.tsx:694-730, CollectionScreen.tsx:591-621, CollageScreen.tsx:159-185
   - Saves ~60 lines of duplication

2. **Create SpotPricesContext** - Centralize spot prices state
   - Currently fetched independently in Dashboard, Collection, Collage
   - Reduces prop drilling and duplicate API calls

3. **Fix TypeScript any types**
   - useCollectionSummary:106 - Add proper return type
   - api.ts image mapping - Type the image response

### Phase 19: Component Refactor (Medium Priority)

1. **Split AddItemScreen** into step components
   - CategorySelection, GradingSelection, BullionForm, NumismaticForm
   - Reduces file from 776 lines to ~200 per component

2. **Extract screen styles to separate files**
   - Create styles/ directory or co-located .styles.ts files
   - DashboardScreen: Move 415 lines of styles
   - CollectionScreen: Move 199 lines of styles

3. **Create TabBar component**
   - Shared bottom navigation across all screens
   - Currently duplicated in Dashboard, Collection, Collage

### Phase 20: API & Data Layer Cleanup (Medium Priority)

1. **Split api.ts into modules**
   - api/client.ts - makeRequest, auth helpers
   - api/collection.ts - Collection CRUD
   - api/coins.ts - Coin search, grades, price guide
   - api/cache.ts - Caching logic

2. **Add request error handling component**
   - Create ErrorDisplay component for API errors
   - Consistent error UI across screens

3. **Fix password validation mismatch**
   - RegisterScreen.tsx:29 says 6 chars, backend requires 8+
   - Sync validation rules with backend

## Dependencies

### Core Framework
- expo: ~54.0.31
- react: 19.1.0
- react-native: 0.81.5
- typescript: ~5.9.2

### Navigation
- @react-navigation/native: ^7.1.26
- @react-navigation/native-stack: ^7.9.0
- react-native-screens: ~4.16.0
- react-native-safe-area-context: ~5.6.0

### Storage
- expo-secure-store: ~15.0.8 (auth tokens)
- @react-native-async-storage/async-storage: ^2.2.0 (caching)

### UI/Styling
- nativewind: ^4.2.1
- tailwindcss: ^3.4.19
- expo-linear-gradient: ~15.0.8
- react-native-svg: 15.12.1

### Charts
- victory-native: ^41.20.2

### Data
- axios: ^1.13.2 (not actively used - fetch preferred)
- fuse.js: ^7.1.0 (offline search)

### Image Handling
- expo-image-picker: ^17.0.10
- expo-image-manipulator: ~14.0.8
- expo-file-system: ~19.0.21

### Other
- expo-constants: ~18.0.13 (environment config)
- @react-native-picker/picker: ^2.11.1
- react-native-modal: ^13.0.1
- react-native-reanimated: ~4.1.1
- react-native-gesture-handler: ~2.28.0
