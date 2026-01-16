# Development History

## Milestones Overview

| Version | Name | Phases | Status |
|---------|------|--------|--------|
| v1.0 | Radial Photo Gallery | 1 | Complete |
| v1.1 | Filter Pills | 2 | Not Started |
| v1.2 | Security & Stability | 3-9 | Partial |
| v1.3 | Chart Improvements | 10-12 | Complete |
| v1.4 | Auth Deployment | 13-16 | Partial |
| v1.5 | Mobile Refactor | 17-20 | Partial |
| v1.6 | Portfolio Valuation | 21-24 | Complete |
| v1.7 | Unified Portfolio | 25 | Complete |
| v1.8 | Mobile Deployment | 26-30 | In Progress |

---

## Completed Phases

### Phase 1: Radial Gallery (v1.0) - 2026-01-09
**Goal:** Premium scroll-driven radial photo gallery

**Delivered:**
- RadialScrollGallery component with GSAP ScrollTrigger
- CollectionPhotoCard with metal badges
- Lightbox modal for item details
- Mobile-responsive radius (desktop: 450px, mobile: 200px)

**Key Decision:** GSAP over Framer Motion for precise scroll-driven animation

---

### Phase 3: Security Hardening (v1.2) - 2026-01-09
**Goal:** Fix critical security vulnerabilities

**Delivered:**
- Removed default JWT secret fallback (fails if missing)
- Strengthened password requirements (8+ chars)
- Protected seed endpoint
- Added rate limiting to auth endpoints (upstash/ratelimit)

---

### Phase 4: Environment Configuration - 2026-01-09
**Goal:** Proper environment management

**Delivered:**
- Fixed hardcoded mobile API URL
- Created comprehensive .env.example files
- Environment-specific configuration

---

### Phase 5: Image Storage Migration - 2026-01-09
**Goal:** Move base64 images to cloud storage

**Delivered:**
- Cloudinary integration
- Updated ImageUploader component
- Migration script for existing images
- URLs stored instead of base64

---

### Phase 10: Chart Axis Refinements (v1.3) - 2026-01-10
**Goal:** Better chart controls

**Delivered:**
- Custom date range picker
- Improved Y-axis scale controls
- Better tick formatting

---

### Phase 11: Additional Visualizations - 2026-01-10
**Goal:** More chart types

**Delivered:**
- AllocationPieChart by metal type
- GainLossBarChart component
- Performance comparison views

---

### Phase 12: Chart Export - 2026-01-10
**Goal:** Export capabilities

**Delivered:**
- Export charts as PNG/JPEG
- Export data as CSV
- Share functionality

---

### Phase 13: Credential Cleanup (v1.4) - 2026-01-10
**Goal:** Remove hardcoded credentials

**Delivered:**
- Removed test credentials from LoginScreen
- Verified .env gitignored
- Created production .env.example
- Security audit documentation

---

### Phase 17: Mobile Code Audit (v1.5) - 2026-01-15
**Goal:** Review and document mobile architecture

**Delivered:**
- Audited file structure
- Documented patterns and anti-patterns
- Created MOBILE-ARCHITECTURE.md
- Identified improvement areas

---

### Phase 18: State Management Refactor - 2026-01-15
**Goal:** Clean up state handling

**Delivered:**
- Created SpotPricesContext for global spot prices
- Reduced prop drilling
- Fixed TypeScript `any` types
- Consolidated context providers

---

### Phase 19: Component Refactor - 2026-01-15
**Goal:** Improve component organization

**Delivered:**
- Split AddItemScreen into step components
- Created shared TabBar component
- Added JSDoc documentation
- Consistent prop interfaces

---

### Phase 21: Bullion Premium Pricing (v1.6) - 2026-01-15
**Goal:** Premium/discount for bullion items

**Delivered:**
- Added `premiumPercent` field to items
- Updated add/edit forms
- Value = spot × weight × (1 + premium%)
- Premium display on item cards

---

### Phase 22: Valuation Type System - 2026-01-15
**Goal:** Multiple valuation methods

**Delivered:**
- `bookValueType`: 'spot_premium' | 'guide_price' | 'custom'
- Bullion defaults to spot_premium
- Numismatic defaults to guide_price
- Backward compatibility maintained

---

### Phase 23: Dynamic Guide Price Integration - 2026-01-15
**Goal:** Track numismatic price changes

**Delivered:**
- ItemValueHistory model for price snapshots
- Manual price guide update mechanism
- Price history display on item details
- Graceful handling of missing prices

---

### Phase 24: Portfolio Dashboard Updates - 2026-01-15
**Goal:** Reflect new valuation model in UI

**Delivered:**
- Valuation breakdown API
- Web dashboard updates
- Mobile dashboard updates
- "Last updated" indicators

---

### Phase 25: Unified Portfolio Display (v1.7) - 2026-01-15
**Goal:** Single portfolio value (no spot/book toggle)

**Delivered:**
- Removed spot/book toggle from mobile
- Removed melt/book display from web
- Single "Portfolio Value" summing all items appropriately
- Daily gain uses unified value

---

### Phase 26: Mobile Radial Collage (v1.8) - 2026-01-16
**Goal:** Port radial gallery to mobile

**Delivered:**
- RadialGallery component with Reanimated
- MobilePhotoCard with badges
- ImageLightbox with gestures
- CollageScreen integration

---

### Phase 27: Device Testing & Bug Fixes - 2026-01-16
**Goal:** Test on real devices, fix bugs

**Delivered:**
- Testing checklist created
- iOS device testing completed
- Bug fixes:
  - Dashboard card spacing
  - Total return calculation (bookValue - purchaseCost)
  - Collection card return display
  - Daily change calculation for bullion vs numismatic
  - Compact currency format ($x.xk for >= $1000)
  - Expandable spot price banner with 24h changes
  - Spot price history tracking for accurate daily gains

---

## Pending Phases

### Not Started
- Phase 2: Filter Pills (Gold/Silver/Platinum filtering)
- Phase 6: Test Foundation (Vitest setup)
- Phase 7: Auth Enhancements (email verification, password reset)
- Phase 8: Performance Fixes (N+1 queries, pagination)
- Phase 9: Radial Collage Scroll Persistence
- Phase 14: Mobile Auth Hardening
- Phase 15: Security Headers & CORS
- Phase 16: Deployment Verification
- Phase 20: API & Data Layer Cleanup

### In Progress (v1.8)
- Phase 28: Performance & Error Handling
- Phase 29: App Store Build Configuration
- Phase 30: Final QA & Deployment Checklist

---

## Key Architectural Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GSAP for scroll animation | ScrollTrigger provides precise scrubbing | 2026-01-09 |
| Cloudinary for images | Better than base64 in DB, CDN benefits | 2026-01-09 |
| Unified portfolio value | Simpler UX, removes confusing toggle | 2026-01-15 |
| Three valuation types | Covers bullion, numismatic, and fixed values | 2026-01-15 |
| Local spot price tracking | Accurate 24h daily gains vs stale historical data | 2026-01-16 |
| Compact currency format | Prevents UI overflow on large values | 2026-01-16 |

---

## Technical Debt Addressed

- [x] Base64 images → Cloudinary URLs
- [x] Hardcoded API URL → Environment config
- [x] Weak passwords → 8+ char requirement
- [x] Default JWT secret → Fail if missing
- [x] No rate limiting → upstash/ratelimit added
- [x] Prop drilling → Context providers
- [x] TypeScript `any` → Proper types

## Technical Debt Remaining

- [ ] No test coverage
- [ ] No email verification
- [ ] No password reset
- [ ] N+1 queries in price history
- [ ] Large mobile sync (no pagination)
- [ ] next-auth beta version

---
*Last updated: 2026-01-16*
