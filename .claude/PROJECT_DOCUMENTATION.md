# Bullion Collection Tracker - Project Documentation

## Overview

A precious metals collection tracker that evolved from a hobby project to a production-ready application. The platform supports tracking both bullion (valued by melt) and numismatic coins (valued by rarity, grade, and recent sales).

**Tech Stack:**
- **Frontend (Web)**: Next.js 14 (App Router), React 18, TypeScript, TanStack Query
- **Frontend (Mobile)**: Expo/React Native, Victory Native for charts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js with JWT tokens
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

---

## Main Features Implemented

### v1.0 - Core Collection Tracking

**Radial Photo Gallery**
- GSAP-powered animated photo collage
- Interactive radial layout for collection visualization
- Mobile-responsive collage view

**Portfolio Dashboard**
- Real-time spot price banner (Gold, Silver, Platinum)
- Portfolio value card with spot/book value toggle
- Holdings breakdown by metal type with visual allocation bar
- Value over time chart with historical performance tracking
- Cost basis, gain/loss, and return calculations

**Collection Management**
- Add/edit/delete bullion and numismatic items
- Purchase price and date tracking
- Image upload with Cloudinary storage
- Notes and quantity tracking

### v1.9 - Deployment Ready

**Testing Infrastructure**
- Vitest testing framework with coverage reporting
- 76 tests covering calculations, validation, and auth flows
- TDD approach for critical business logic

**Security Hardening**
- JWT tokens with 7-day expiry and refresh rotation
- Security headers middleware (CSP, X-Frame-Options, HSTS)
- API rate limiting on collection endpoints
- Input validation and sanitization utilities
- Centralized error handling with ApiError class

**Performance Optimization**
- N+1 query fixes with batch queries
- Cursor-based pagination for collection API
- Bundle optimization for recharts and GSAP
- Transactional writes for price sync

**Code Quality**
- All TypeScript `any` types replaced with proper types
- Dead code removal across codebase
- ESLint strict mode enforcement

**Deployment Configuration**
- Health check endpoint (`/api/health`) with dependency checks
- Sentry error monitoring (conditional initialization)
- Vercel configuration optimized for iad1 region
- Comprehensive deployment runbook

### v2.0 - Mobile Charts

**Victory Native Integration**
- Skia-based chart rendering for high performance
- Consistent chart theme matching web design system
- ChartContainer wrapper component for layout

**Interactive Charts**
- Portfolio line chart with time range selector (1W, 1M, 1Y, 5Y)
- Allocation donut chart with metal/category toggle
- Gain/loss bar chart with color-coded positive/negative values
- Touch interactions with useChartPressState hooks
- Animated transitions and smooth scrolling

### v2.1 - Coin Database Expansion

**PCGS API Integration**
- TypeScript PCGS API client with OAuth2 authentication
- Token caching with automatic refresh
- Daily quota tracking (1,000 calls/day limit)
- Retry logic with exponential backoff

**Database Infrastructure**
- 67 coin series mapped across 4 priority tiers (P0-P3)
- Full-text search with PostgreSQL tsvector and GIN index
- Relevance-ranked search results with ts_rank
- Weight priorities: A=fullName, B=series, C=denomination, D=year

**Automation**
- Bulk scraper with progress tracking and circuit breaker
- Price refresh automation via Vercel cron
- Data validation CLI (validate_data.py)

### v2.2 - Certificate Number Autofill

**Cert Lookup API**
- PCGS API integration for certificate verification
- NGC fallback support
- Debounced lookup (800ms) for performance

**Web Integration**
- useCertLookup hook with TanStack Query
- Auto-population of grade, metal, and price fields
- Error handling and loading states

**Mobile Scanner**
- expo-camera barcode scanner
- Multi-format support (PCGS ITF + NGC QR codes)
- Auto service detection from barcode format
- Full-screen scanner modal UX

### v2.3 - App Store Legal

**Privacy Policy**
- Comprehensive 11-section privacy policy at `/privacy`
- Covers data collection, storage, third-party services, user rights
- GDPR and CCPA compliant language

**Contact & Support**
- Support page at `/contact`
- Email support with documented response times (24-48 hours)
- Common topics FAQ section
- Business hours disclosure (Mon-Fri 9-6 EST)

**Footer Integration**
- Web footer with legal links
- Mobile footer using Linking API for web URLs

### v2.4 - Security & Stability

**Authentication Audit**
- Reduced token refresh grace period from 7 days to 1 day
- HSTS header enabled for production
- OAuth keys fail-hard in production environment
- Mocked Prisma tests for auth endpoints

**Data Security**
- FDX exact-match authorization for financial data
- User existence verification for JWT tokens
- Runtime fail-hard for rate limiting

**Account Deletion**
- 8 cascade delete relationships documented
- Cloudinary orphan cleanup path identified

**Mobile Auth**
- SecureStore audit passed (WHEN_UNLOCKED default is secure)
- Certificate pinning evaluation (HTTPS + HSTS deemed sufficient)

### v2.5 - Numismatic Metal Content (In Progress)

**Metal Content Data Model** (Complete)
- Schema fields: metal type, purity, weight, precious metal oz
- Float (0.0-1.0) for purity representation
- Nullable fields for backward compatibility
- Metal calculation utility functions

**US Historical Coinage Rules Engine** (Complete)
- Pre-1965 silver detection (dimes, quarters, half dollars = 90% silver)
- Pre-1933 gold denomination detection ($2.50, $5, $10, $20)
- US Mint official specs for precious metal calculations
- 37 unit tests covering all rules
- CoinReference data takes precedence over rules engine

---

## Design Choices & Architecture

### Authentication & Security

| Decision | Rationale |
|----------|-----------|
| JWT with 7-day expiry | Balance between security and user convenience |
| Refresh token rotation | Prevent token reuse attacks |
| Email normalization at signup | Prevent duplicate accounts |
| HSTS enabled in production | Enforce HTTPS connections |
| OAuth keys fail-hard | Prevent silent auth failures |
| SecureStore with WHEN_UNLOCKED | Native iOS/Android secure storage |
| No certificate pinning | HTTPS + HSTS provides sufficient protection |
| No biometric auth | Low risk for collection tracker app |

### Data & API

| Decision | Rationale |
|----------|-----------|
| Cursor-based pagination | Better performance for large collections |
| tsvector for search | Native PostgreSQL full-text search |
| TypeScript over Python for PCGS client | Unified codebase, easier maintenance |
| 800ms debounce for cert lookup | Prevent API rate limit exhaustion |
| Float for purity (0.0-1.0) | Precise calculations, avoid percentage rounding |
| CoinReference precedence over rules | Flexibility for exceptions and corrections |

### Frontend & UX

| Decision | Rationale |
|----------|-----------|
| Victory Native for mobile charts | Skia-based rendering, Expo compatible |
| GSAP for radial gallery | Smooth animations, timeline control |
| TanStack Query for data fetching | Caching, background refresh, optimistic updates |
| Full-screen scanner modal | Focused UX, better camera access |
| Linking API for mobile legal pages | Consistent web experience, easier updates |

### Infrastructure

| Decision | Rationale |
|----------|-----------|
| Vercel iad1 region | US East coast for latency optimization |
| Neon database | Free tier PostgreSQL with serverless scaling |
| Cloudinary for images | CDN delivery, image transformations |
| Sentry conditional init | Avoid local development noise |
| Circuit breaker for scraper | Resilience against API failures |

### Design System

```typescript
// Colors
const colors = {
  background: '#F8F7F4',
  cardBackground: 'white',
  text: '#1a1a1a',
  textSecondary: '#666',
  textMuted: '#888',
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  goldAccent: '#D4AF37',
  silver: '#A8A8A8',
  platinum: '#E5E4E2',
  green: '#22C55E',
  red: '#EF4444',
};

// Card style
const cardStyle = {
  background: 'white',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

// Typography
fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
fontFamily: 'monospace'  // for numbers
```

---

## Outstanding & Future Implementations

### v2.5 Numismatic Metal Content (Remaining)

**Phase 60: Cert Lookup Metal Autofill**
- Extend PCGS/NGC cert lookup to populate metal content
- Auto-detect metal type, purity, weight from certification data
- Fallback to rules engine when cert data incomplete

**Phase 61: Manual Metal Input UI**
- Metal type selector (Gold, Silver, Platinum, Palladium)
- Purity input with validation (0.0-1.0)
- Weight input in troy ounces
- Fallback for raw/ungraded coins

**Phase 62: Portfolio Metal Aggregation**
- Calculate total precious metal weight across portfolio
- Breakdown by metal type (total gold oz, silver oz, etc.)
- Display in portfolio summary and dashboard

### v1.8 Mobile Deployment (Incomplete)

**Phase 28: Performance & Error Handling**
- Optimize mobile app performance
- Add proper error handling and user feedback
- Loading states and skeleton screens

**Phase 29: App Store Build Configuration**
- EAS Build configuration for iOS and Android
- App Store Connect setup
- Google Play Console setup

**Phase 30: Final QA & Deployment**
- Complete testing on multiple devices
- App store metadata and screenshots
- Deployment verification checklist

### Deferred Technical Debt

| Item | Notes |
|------|-------|
| Email verification flow | Not implemented, low priority |
| Password reset flow | Not implemented, medium priority |
| next-auth 5 beta | May have breaking changes, monitor |
| Cloudinary orphan cleanup | Images not deleted on account deletion |
| Custom domain | Using Vercel URL, bulliontracker.app TBD |
| Contact form | Using email-only approach |
| NGC cross-reference | Not needed with API approach |
| Actual coin population | Only ~100 coins, infrastructure ready for 8,000+ |

### Skipped Phases (Historical)

These phases were deprioritized during early development:
- Phase 2: Filter Pills
- Phase 6: Test Foundation (addressed in v1.9)
- Phase 7: Auth Enhancements
- Phase 8: Performance Fixes (addressed in v1.9)
- Phase 9: Radial Collage Scroll Persistence
- Phase 14: Mobile Auth Hardening (addressed in v2.4)
- Phase 15: Security Headers & CORS (addressed in v1.9)
- Phase 16: Deployment Verification (addressed in v1.9)
- Phase 20: API & Data Layer Cleanup

---

## Technical Specifications

### Numismatic Valuation Engine

The valuation system calculates coin values based on grading service, recent sales, and condition.

**Valuation Priority:**
1. Recent sales (last 90 days, median of clean coin sales)
2. Price guide (PCGS prices, adjusted 10% down)
3. User-defined custom value

**Confidence Levels:**
| Level | Criteria |
|-------|----------|
| High | 3+ recent sales for exact grade |
| Medium | 1-2 recent sales OR price guide available |
| Low | No sales data, estimated grade, or problem coin |
| User Defined | Custom value entered by user |

**Problem Coin Discounts:**
```python
PROBLEM_DISCOUNTS = {
    'cleaned': 0.50,        # 50% of clean coin value
    'environmental': 0.60,  # 60% of clean coin value
    'damaged': 0.40,        # 40% of clean coin value
    'questionable_toning': 0.70,  # 70% of clean coin value
    'other': 0.50,          # 50% of clean coin value
}
```

**Raw Coin Discount:** 15% discount (0.85 multiplier) for ungraded coins

**Grade Uncertainty:** For estimated grades, value is calculated as average across adjacent grades (±2 positions)

### Grading Scale Reference

Complete Sheldon scale grades (41 total):

| Category | Grades | Range |
|----------|--------|-------|
| Poor | PO01 | 1 |
| Fair | FR02 | 2 |
| About Good | AG03 | 3 |
| Good | G04, G06 | 4-6 |
| Very Good | VG08, VG10 | 8-10 |
| Fine | F12, F15 | 12-15 |
| Very Fine | VF20, VF25, VF30, VF35 | 20-35 |
| Extremely Fine | EF40, EF45 | 40-45 |
| About Uncirculated | AU50, AU53, AU55, AU58 | 50-58 |
| Mint State | MS60-MS70 | 60-70 |
| Proof | PR60-PR70 | 60-70 |

### API Endpoints

**Collection Management:**
```
GET    /api/collection              # List user's collection (with category filter)
GET    /api/collection/summary      # Portfolio summary with breakdowns
POST   /api/collection/bullion      # Add bullion item
POST   /api/collection/numismatic   # Add numismatic coin
DELETE /api/collection/:id          # Remove item
```

**Coin Reference:**
```
GET  /api/coins/search?q=          # Full-text search coins
GET  /api/coins/:pcgsNumber        # Get coin details
GET  /api/coins/:pcgsNumber/prices # Get price guide for all grades
GET  /api/coins/:pcgsNumber/sales  # Get recent sales history
GET  /api/coins/cert/:certNumber   # Lookup graded coin by cert
GET  /api/grades                   # Get all valid grades grouped
```

**System:**
```
GET  /api/health                   # Health check with dependencies
GET  /api/spot-prices              # Current metal spot prices
POST /api/sync-prices              # Trigger price refresh
```

### Frontend Component Architecture

**Add Item Modal Flow:**
```
Step 1: Category Selection
├── BULLION → Step 2a: Bullion Form
│   └── Metal, weight, fineness, quantity, purchase info
└── NUMISMATIC → Step 2b: Grading Service
    ├── PCGS/NGC → Step 3a: Cert Lookup
    │   └── Auto-populate from cert number
    └── RAW → Step 3b: Coin Search
        └── Search coins + grade selector + problem toggle
```

**React Hooks:**
```typescript
useSpotPrices()           // Real-time metal prices
usePortfolioSummary()     // Aggregate portfolio data
useCollection(category?)  // User's collection items
useCollectionSummary()    // Category breakdowns
useCoinSearch(query)      // Coin reference search
useCertLookup(certNumber, service)  // Cert verification
useGrades()               // Valid grades grouped
useCoinValuation(pcgsNumber, grade) // Price/sales data
```

**Shared Components:**
- `ConfidenceIndicator` - 4-dot visual with label
- `CategoryBadge` - BULLION (gold) or NUMISMATIC (blue)
- `ProblemBadge` - Red badge for cleaned/damaged coins
- `GradeSelector` - Dropdown grouped by category

### Scraper Configuration

**Target Series (67 total, 4 priority tiers):**

| Priority | Examples | Est. Coins |
|----------|----------|------------|
| P0 | Silver Eagles, Gold Eagles, Morgan Dollars, Lincoln Cents | ~730 |
| P1 | Peace Dollars, Barber series, Walking Liberty Halves | ~275 |
| P2 | Standing Liberty Quarters, Mercury Dimes, Buffalo Nickels | ~500 |
| P3 | Early type coins, commemoratives, modern issues | ~6,000+ |

**Rate Limiting:**
- 1-2 second delay between requests
- Exponential backoff on failures (2x multiplier)
- Maximum 3 retries per request
- Circuit breaker for consecutive failures
- Daily API quota: 1,000 calls

**Scraper CLI:**
```bash
python scripts/seed_grades.py              # Seed grades table
python scripts/run_scraper.py --series X   # Single series
python scripts/run_scraper.py --priority P0  # Priority tier
python scripts/run_scraper.py --all        # All series
python scripts/refresh_prices.py           # Update prices only
python scripts/validate_data.py            # Data quality report
```

---

## Database Schema

### Collection Items Table

```sql
CREATE TABLE collection_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Classification
    item_category VARCHAR(20) NOT NULL CHECK (item_category IN ('BULLION', 'NUMISMATIC')),

    -- Common fields
    name VARCHAR(300) NOT NULL,
    purchase_price DECIMAL(12, 2),
    purchase_date DATE,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    images TEXT[],

    -- Bullion-specific
    metal VARCHAR(20),
    weight_oz DECIMAL(10, 4),
    fineness DECIMAL(5, 4),
    bullion_type VARCHAR(50),

    -- Numismatic-specific
    coin_reference_id INTEGER REFERENCES coin_references(id),
    grading_service VARCHAR(10) CHECK (grading_service IN ('PCGS', 'NGC', 'RAW')),
    cert_number VARCHAR(20),
    grade_code VARCHAR(10) REFERENCES valid_grades(grade_code),
    is_grade_estimate BOOLEAN DEFAULT FALSE,
    is_problem_coin BOOLEAN DEFAULT FALSE,
    problem_type VARCHAR(50),

    -- Valuation
    valuation_method VARCHAR(20) NOT NULL CHECK (valuation_method IN ('melt', 'recent_sales', 'price_guide', 'custom')),
    custom_value DECIMAL(12, 2),
    calculated_value DECIMAL(12, 2),
    value_confidence VARCHAR(10) CHECK (value_confidence IN ('high', 'medium', 'low', 'user_defined')),
    last_valued_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collection_user ON collection_items(user_id);
CREATE INDEX idx_collection_category ON collection_items(item_category);
```

### Coin Reference Table

```sql
CREATE TABLE coin_references (
    id SERIAL PRIMARY KEY,
    pcgs_number INTEGER UNIQUE NOT NULL,
    ngc_number INTEGER,
    year INTEGER NOT NULL,
    mint_mark VARCHAR(5),
    denomination VARCHAR(50) NOT NULL,
    series VARCHAR(100) NOT NULL,
    variety VARCHAR(200),
    metal VARCHAR(20),
    weight_oz DECIMAL(10, 4),
    fineness DECIMAL(5, 4),
    mintage INTEGER,
    full_name VARCHAR(300) NOT NULL,
    search_tokens TSVECTOR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coin_search ON coin_references USING GIN(search_tokens);
CREATE INDEX idx_coin_pcgs ON coin_references(pcgs_number);
CREATE INDEX idx_coin_series ON coin_references(series);
CREATE INDEX idx_coin_year ON coin_references(year);
```

### Supporting Tables

```sql
-- Valid grades lookup
CREATE TABLE valid_grades (
    id SERIAL PRIMARY KEY,
    grade_code VARCHAR(10) UNIQUE NOT NULL,
    numeric_value INTEGER NOT NULL,
    grade_category VARCHAR(30) NOT NULL,
    display_order INTEGER NOT NULL
);

-- Price guide (refreshed daily)
CREATE TABLE coin_price_guide (
    id SERIAL PRIMARY KEY,
    coin_reference_id INTEGER REFERENCES coin_references(id) ON DELETE CASCADE,
    grade_code VARCHAR(10) REFERENCES valid_grades(grade_code),
    pcgs_price DECIMAL(12, 2),
    price_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(coin_reference_id, grade_code, price_date)
);

-- Recent sales history
CREATE TABLE coin_sales (
    id SERIAL PRIMARY KEY,
    coin_reference_id INTEGER REFERENCES coin_references(id) ON DELETE CASCADE,
    grade_code VARCHAR(10),
    sale_price DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_url TEXT,
    cert_number VARCHAR(20),
    is_problem_coin BOOLEAN DEFAULT FALSE,
    problem_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_lookup ON coin_sales(coin_reference_id, grade_code, sale_date DESC);
```

---

## Milestone History

| Version | Name | Shipped | Key Deliverables |
|---------|------|---------|------------------|
| v1.0 | Radial Photo Gallery | 2026-01-09 | GSAP gallery, core tracking |
| v1.2 | Security & Stability | 2026-01-09 | Initial security hardening |
| v1.3 | Chart Improvements | 2026-01-10 | Enhanced visualizations |
| v1.4 | Auth Deployment | 2026-01-10 | Authentication deployment |
| v1.5 | Mobile Refactor | 2026-01-15 | Mobile app restructuring |
| v1.6 | Portfolio Valuation | 2026-01-15 | Valuation model |
| v1.7 | Unified Portfolio | 2026-01-15 | Combined portfolio display |
| v1.9 | Deployment Ready | 2026-01-17 | 76 tests, security, performance |
| v2.0 | Mobile Charts | 2026-01-18 | Victory Native integration |
| v2.1 | Coin Database Expansion | 2026-01-18 | PCGS API, search, validation |
| v2.2 | Cert Number Autofill | 2026-01-18 | Scanner, autofill, lookup |
| v2.3 | App Store Legal | 2026-01-19 | Privacy, contact pages |
| v2.4 | Security & Stability | 2026-01-23 | Auth audit, data security |
| v2.5 | Numismatic Metal Content | In Progress | Metal tracking (40% complete) |

---

*Last updated: 2026-01-24*
*For current project state, see `.planning/STATE.md`*
*For detailed roadmap, see `.planning/ROADMAP.md`*
