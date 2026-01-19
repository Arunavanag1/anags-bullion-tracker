# Roadmap: Bullion Collection Tracker

## Overview

A precious metals collection tracker evolving from feature-complete hobby project to production-ready deployment. Phases 1-30 built core features; Phase 31+ focuses on code quality, security hardening, and deployment readiness.

## Domain Expertise

None (standard web/mobile patterns)

## Milestones

- :white_check_mark: **v1.0 Radial Photo Gallery** - Phase 1 (shipped 2026-01-09)
- :white_check_mark: **v1.2 Security & Stability** - Phases 3-5 (partial, shipped 2026-01-09)
- :white_check_mark: **v1.3 Chart Improvements** - Phases 10-12 (shipped 2026-01-10)
- :white_check_mark: **v1.4 Auth Deployment** - Phase 13 (partial, shipped 2026-01-10)
- :white_check_mark: **v1.5 Mobile Refactor** - Phases 17-19 (shipped 2026-01-15)
- :white_check_mark: **v1.6 Portfolio Valuation** - Phases 21-24 (shipped 2026-01-15)
- :white_check_mark: **v1.7 Unified Portfolio** - Phase 25 (shipped 2026-01-15)
- :construction: **v1.8 Mobile Deployment** - Phases 26-30 (in progress)
- :white_check_mark: **v1.9 Deployment Ready** - Phases 31-36 (complete 2026-01-17)
- :construction: **v2.0 Mobile Charts** - Phases 37-42 (in progress)
- :white_check_mark: **v2.1 Coin Database Expansion** - Phases 43-48 (shipped 2026-01-18)
- :clipboard: **v2.2 Cert Number Autofill** - Phases 49-51 (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>:white_check_mark: v1.0-v1.8 Completed Phases (1-30) - See DEVELOPMENT-HISTORY.md</summary>

Historical phases documented in `DEVELOPMENT-HISTORY.md`. Key completed work:
- Radial photo gallery (GSAP)
- Security hardening & rate limiting
- Cloudinary image storage
- Chart improvements & export
- Mobile refactoring
- Portfolio valuation model
- Unified portfolio display
- Mobile radial collage
- Device testing & bug fixes

**Skipped phases (technical debt):**
- Phase 2: Filter Pills
- Phase 6: Test Foundation
- Phase 7: Auth Enhancements
- Phase 8: Performance Fixes
- Phase 9: Radial Collage Scroll Persistence
- Phase 14: Mobile Auth Hardening
- Phase 15: Security Headers & CORS
- Phase 16: Deployment Verification
- Phase 20: API & Data Layer Cleanup

</details>

### :construction: v1.8 Mobile Deployment (In Progress)

**Milestone Goal:** Ship mobile app to app stores

#### Phase 28: Performance & Error Handling
**Goal**: Optimize performance, add proper error handling
**Depends on**: Phase 27
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [ ] 28-01: TBD (run /gsd:plan-phase 28 to break down)

#### Phase 29: App Store Build Configuration
**Goal**: Configure builds for iOS App Store and Google Play
**Depends on**: Phase 28
**Research**: Likely (Expo EAS build, app store requirements)
**Research topics**: EAS Build configuration, App Store Connect, Google Play Console
**Plans**: TBD

Plans:
- [ ] 29-01: TBD

#### Phase 30: Final QA & Deployment Checklist
**Goal**: Complete testing and deployment verification
**Depends on**: Phase 29
**Research**: Unlikely (internal QA)
**Plans**: TBD

Plans:
- [ ] 30-01: TBD

---

<details>
<summary>:white_check_mark: v1.9 Deployment Ready (Phases 31-36) — SHIPPED 2026-01-17</summary>

See [milestones/v1.9-ROADMAP.md](milestones/v1.9-ROADMAP.md) for full details.

- [x] Phase 31: Test Foundation (3/3 plans) — 76 tests, Vitest setup
- [x] Phase 32: Auth Security Audit (1/1 plan) — JWT hardening, refresh tokens
- [x] Phase 33: API Hardening (2/2 plans) — Security headers, rate limiting
- [x] Phase 34: Performance Review (2/2 plans) — N+1 fixes, pagination
- [x] Phase 35: Code Quality Sweep (2/2 plans) — Strict types, dead code removal
- [x] Phase 36: Deployment Verification (2/2 plans) — Health check, Sentry, Vercel config

</details>

---

### :clipboard: v2.0 Mobile Charts (Planned)

**Milestone Goal:** Add interactive, aesthetic charts to the mobile app dashboard, matching website functionality

#### Phase 37: Victory Native Setup - COMPLETE
**Goal**: Install Victory Native, configure dependencies, create base chart theme and wrapper components
**Depends on**: Phase 36
**Research**: Likely (Victory Native integration with Expo)
**Research topics**: Victory Native installation, Expo compatibility, theming and customization
**Plans**: 1/1

Plans:
- [x] 37-01: Skia dependency, chart theme, ChartContainer, TestChart

#### Phase 38: Portfolio Line Chart - COMPLETE
**Goal**: Interactive line chart showing portfolio value over time with time range selector (1W, 1M, 1Y, 5Y)
**Depends on**: Phase 37
**Research**: Unlikely (Victory patterns established)
**Plans**: 1/1

Plans:
- [x] 38-01: API function, PortfolioLineChart component, time range selector

#### Phase 39: Allocation Donut Chart - COMPLETE
**Goal**: Animated pie/donut chart with metal and category toggle, replacing existing SVG implementation
**Depends on**: Phase 38
**Research**: Unlikely (Victory patterns established)
**Plans**: 1/1

Plans:
- [x] 39-01: Victory Native PolarChart with metal/category toggle

#### Phase 40: Gain/Loss Bar Chart - COMPLETE
**Goal**: Horizontal bar chart showing gain/loss by metal with color-coded positive/negative values
**Depends on**: Phase 39
**Research**: Unlikely (Victory patterns established)
**Plans**: 1/1

Plans:
- [x] 40-01: GainLossBarChart with horizontal bars, color-coding, summary stats

#### Phase 41: Chart Interactions - COMPLETE
**Goal**: Touch gestures, tooltips, zoom/pan, smooth animations, and responsive sizing
**Depends on**: Phase 40
**Research**: Likely (mobile-specific gesture handling)
**Research topics**: Victory Native touch events, gesture handling, performance optimization
**Plans**: 1/1

Plans:
- [x] 41-01: Touch interactions - useChartPressState, Skia indicator, interactive legend

#### Phase 42: Dashboard Integration
**Goal**: Layout charts at bottom of dashboard in scrollable section with consistent styling
**Depends on**: Phase 41
**Research**: Unlikely (internal UI work)
**Plans**: 1/1

Plans:
- [ ] 42-01: Add GainLossBarChart, organize ANALYTICS section, remove redundant allocation card

---

<details>
<summary>:white_check_mark: v2.1 Coin Database Expansion (Phases 43-48) — SHIPPED 2026-01-18</summary>

See [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md) for full details.

- [x] Phase 43: PCGS API Integration (1/1 plan) — OAuth2 client, quota tracking
- [x] Phase 44: Series Priority Mapping (1/1 plan) — 67 series, P0-P3 tiers
- [x] Phase 45: Bulk Scraper Enhancement (1/1 plan) — Progress tracking, circuit breaker
- [x] Phase 46: Data Population Pipeline (1/1 plan) — Validation module, monitoring
- [x] Phase 47: Price Refresh Automation (1/1 plan) — Vercel cron, daily sync
- [x] Phase 48: Search & Validation (1/1 plan) — Full-text search, validate_data.py

</details>

---

### :clipboard: v2.2 Cert Number Autofill (Planned)

**Milestone Goal:** Add autofill functionality for coins using PCGS/NGC certification numbers, enabling quick coin lookup and form population

#### Phase 49: Cert Lookup API Integration - COMPLETE
**Goal**: Integrate PCGS Cert Verification and NGC Verify APIs for certification number lookup
**Depends on**: Phase 48
**Research**: Complete (see RESEARCH.md)
**Plans**: 1/1

Plans:
- [x] 49-01: API endpoint, TypeScript PCGS client, mobile integration, form autofill

#### Phase 50: Autofill Form Component - COMPLETE
**Goal**: Create cert number input with debounced lookup, auto-populate form fields from cert data
**Depends on**: Phase 49
**Research**: Unlikely (internal React patterns)
**Plans**: 1/1

Plans:
- [x] 50-01: useCertLookup hook, AddItemModal integration, NGC fallback

#### Phase 51: Mobile Cert Scanner
**Goal**: Add camera-based barcode/QR scanning and OCR for cert number extraction on mobile
**Depends on**: Phase 50
**Research**: Likely (Expo camera, barcode scanning, OCR)
**Research topics**: expo-camera, expo-barcode-scanner, OCR libraries (Tesseract.js or cloud OCR)
**Plans**: TBD

Plans:
- [ ] 51-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order. v1.8 and v1.9 can partially overlap (testing can start while mobile deployment continues).

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 28. Performance & Error Handling | v1.8 | 0/? | In progress | - |
| 29. App Store Build | v1.8 | 0/? | Not started | - |
| 30. Final QA | v1.8 | 0/? | Not started | - |
| 31-36 | v1.9 | 12/12 | **SHIPPED** | 2026-01-17 |
| 37. Victory Native Setup | v2.0 | 1/1 | **COMPLETE** | 2026-01-17 |
| 38. Portfolio Line Chart | v2.0 | 1/1 | **COMPLETE** | 2026-01-17 |
| 39. Allocation Donut Chart | v2.0 | 1/1 | **COMPLETE** | 2026-01-17 |
| 40. Gain/Loss Bar Chart | v2.0 | 1/1 | **COMPLETE** | 2026-01-17 |
| 41. Chart Interactions | v2.0 | 1/1 | **COMPLETE** | 2026-01-17 |
| 42. Dashboard Integration | v2.0 | 0/1 | Planned | - |
| 43-48 | v2.1 | 6/6 | **SHIPPED** | 2026-01-18 |
| 49. Cert Lookup API | v2.2 | 1/1 | **COMPLETE** | 2026-01-18 |
| 50. Autofill Form Component | v2.2 | 1/1 | **COMPLETE** | 2026-01-18 |
| 51. Mobile Cert Scanner | v2.2 | 0/? | Not started | - |
