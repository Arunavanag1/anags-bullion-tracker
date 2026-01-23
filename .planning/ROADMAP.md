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
- :white_check_mark: **v2.0 Mobile Charts** - Phases 37-42 (shipped 2026-01-18)
- :white_check_mark: **v2.1 Coin Database Expansion** - Phases 43-48 (shipped 2026-01-18)
- :white_check_mark: **v2.2 Cert Number Autofill** - Phases 49-51 (shipped 2026-01-18)
- :white_check_mark: **v2.3 App Store Legal** — Phases 52-53 (shipped 2026-01-19)
- :construction: **v2.4 Security & Stability** — Phases 54-57 (in progress)

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

### :white_check_mark: v2.0 Mobile Charts (Shipped 2026-01-18)

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

#### Phase 42: Dashboard Integration - COMPLETE
**Goal**: Layout charts at bottom of dashboard in scrollable section with consistent styling
**Depends on**: Phase 41
**Research**: Unlikely (internal UI work)
**Plans**: 1/1

Plans:
- [x] 42-01: Add GainLossBarChart, organize ANALYTICS section, remove redundant allocation card

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

<details>
<summary>:white_check_mark: v2.2 Cert Number Autofill (Phases 49-51) — SHIPPED 2026-01-18</summary>

See [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md) for full details.

- [x] Phase 49: Cert Lookup API Integration (1/1 plan) — PCGS API client, cert lookup endpoint
- [x] Phase 50: Autofill Form Component (1/1 plan) — useCertLookup hook, web integration
- [x] Phase 51: Mobile Cert Scanner (1/1 plan) — expo-camera barcode scanner, auto-detect service

</details>

---

<details>
<summary>:white_check_mark: v2.3 App Store Legal (Phases 52-53) — SHIPPED 2026-01-19</summary>

See [milestones/v2.3-ROADMAP.md](milestones/v2.3-ROADMAP.md) for full details.

- [x] Phase 52: Privacy Policy Page (1/1 plan) — Privacy policy, web footer, mobile links
- [x] Phase 53: Contact & Support Page (1/1 plan) — Email support, response times, business hours

</details>

---

### :construction: v2.4 Security & Stability (In Progress)

**Milestone Goal:** Comprehensive security audit of authentication, data handling, and account management to ensure production readiness and user data protection.

#### Phase 54: Auth Security Audit
**Goal**: Review JWT implementation, token storage, password hashing, session management for vulnerabilities
**Depends on**: Phase 53
**Research**: Unlikely (internal review)
**Plans**: TBD

Plans:
- [ ] 54-01: TBD (run /gsd:plan-phase 54 to break down)

#### Phase 55: Data Security Review
**Goal**: Audit data exposure in API responses, input validation, SQL injection prevention, sensitive data handling
**Depends on**: Phase 54
**Research**: Unlikely (internal review)
**Plans**: TBD

Plans:
- [ ] 55-01: TBD

#### Phase 56: Account Deletion Security
**Goal**: Verify cascade deletes work correctly, ensure no orphaned data remains, test complete deletion flow
**Depends on**: Phase 55
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [ ] 56-01: TBD

#### Phase 57: Mobile Auth Hardening
**Goal**: Secure token storage review, evaluate biometric auth, consider certificate pinning
**Depends on**: Phase 56
**Research**: Likely (SecureStore best practices, certificate pinning)
**Research topics**: Expo SecureStore security, biometric authentication options, SSL pinning in React Native
**Plans**: TBD

Plans:
- [ ] 57-01: TBD

---

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
| 42. Dashboard Integration | v2.0 | 1/1 | **COMPLETE** | 2026-01-17 |
| 43-48 | v2.1 | 6/6 | **SHIPPED** | 2026-01-18 |
| 49-51 | v2.2 | 3/3 | **SHIPPED** | 2026-01-18 |
| 52. Privacy Policy Page | v2.3 | 1/1 | **COMPLETE** | 2026-01-19 |
| 53. Contact & Support Page | v2.3 | 1/1 | **COMPLETE** | 2026-01-19 |
| 54. Auth Security Audit | v2.4 | 0/? | Not started | - |
| 55. Data Security Review | v2.4 | 0/? | Not started | - |
| 56. Account Deletion Security | v2.4 | 0/? | Not started | - |
| 57. Mobile Auth Hardening | v2.4 | 0/? | Not started | - |
