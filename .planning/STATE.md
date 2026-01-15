# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-09)

**Core value:** Showcase coin photography beautifully
**Current focus:** v1.5 Mobile Refactor — Phase 19 complete, Phase 20 next
**Next milestone:** v1.5 Mobile Refactor (in progress)

## Current Position

Phase: 19 of 20 (Component Refactor) — COMPLETE
Plan: 1 of 1 in current phase (19-01 complete)
Status: v1.5 Mobile Refactor in progress
Last activity: 2026-01-15 — Completed 19-01-PLAN.md (Component Refactor)

Progress: █████░░░░░ 50% (12 of 24 phases complete)

## Milestones Overview

| Milestone | Phases | Status |
|-----------|--------|--------|
| v1.0 Radial Photo Gallery | 1 | SHIPPED |
| v1.1 Filter Pills | 2 | In Progress |
| v1.2 Security & Stability | 3-9 | Planned |
| v1.3 Improvements | 10-12 | COMPLETE |
| v1.4 Auth Deployment | 13-16 | In Progress |
| v1.5 Mobile Refactor | 17-20 | In Progress |
| v1.6 Portfolio Valuation Model | 21-24 | Planned |

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~29 min
- Total execution time: 2.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1 | 15m | 15m |
| 3 | 2 | 11m | 5.5m |
| 4 | 1 | 4m | 4m |
| 5 | 1 | 115m | 115m |
| 10 | 1 | 25m | 25m |
| 11 | 1 | 20m | 20m |
| 12 | 1 | 18m | 18m |
| 13 | 1 | 26m | 26m |
| 17 | 1 | 15m | 15m |
| 18 | 1 | 8m | 8m |
| 19 | 1 | 7m | 7m |

**Recent Trend:**
- Last 5 plans: 26m, 15m, 8m, 7m
- Trend: Refactor phases executing quickly due to clear audit guidance

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: GSAP over Framer Motion for scroll animation
- Phase 1: Replace collage page rather than add new route
- Phase 1: Skip filter pills in v1, include lightbox
- Phase 3: Use helper function pattern for JWT_SECRET TypeScript narrowing
- Phase 3: Password requires 8+ chars, uppercase, lowercase, number (no special chars)
- Phase 3: Seed endpoint uses NODE_ENV + optional ADMIN_SEED_KEY
- Phase 3: Sliding window rate limit (5 req/60s) with graceful dev fallback
- Phase 4: Use expo-constants for mobile config (app.json extra, not .env)
- Phase 5: Cloudinary over S3 for unsigned uploads (no server roundtrip)
- Phase 5: Fallback to base64 when Cloudinary not configured (dev-friendly)
- Phase 13: Complete removal of test credentials UI (no development fallback)
- Phase 13: Security audit sections in .env.example with phase references
- Phase 18: SpotPricesContext placed inside AuthProvider (prices don't require auth)
- Phase 18: Shared UI components follow Button.tsx pattern (Props interface, StyleSheet)
- Phase 18: Context pattern: Provider + useX hook that throws if outside provider
- Phase 19: Multi-step form pattern: Parent manages step state, child components handle step UI
- Phase 19: Form components accept onSubmit callback with typed data interface
- Phase 19: JSDoc with @example for component usage documentation

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

### Roadmap Evolution

- Milestone v1.2 created: Security & Stability, 7 phases (Phase 3-9)
  - Phase 3: Security Hardening (critical vulnerabilities)
  - Phase 4: Environment Configuration
  - Phase 5: Image Storage Migration (base64 → cloud)
  - Phase 6: Test Foundation
  - Phase 7: Auth Enhancements (email verification, password reset)
  - Phase 8: Performance Fixes
  - Phase 9: Radial Collage Scroll Persistence (fix disappearing after full rotation)

- Milestone v1.3 created: Improvements (Chart Enhancements), 3 phases (Phase 10-12)
  - Phase 10: Chart Axis Refinements (Y-axis scale controls, X-axis date range)
  - Phase 11: Additional Visualizations (pie/bar charts for allocation)
  - Phase 12: Chart Export (PNG/CSV export, share functionality)

- Milestone v1.4 created: Auth Deployment (production auth fixes), 4 phases (Phase 13-16)
  - Phase 13: Credential Cleanup (remove hardcoded creds, secure env vars)
  - Phase 14: Mobile Auth Hardening (token refresh, API URL config)
  - Phase 15: Security Headers & CORS (CSP, HSTS, CORS middleware)
  - Phase 16: Deployment Verification (end-to-end auth testing)

- Milestone v1.5 created: Mobile Refactor (stability, efficiency, documentation), 4 phases (Phase 17-20)
  - Phase 17: Mobile Code Audit (review, identify patterns, document architecture)
  - Phase 18: State Management Refactor (clean up state, reduce prop drilling)
  - Phase 19: Component Refactor (extract reusable components, improve types)
  - Phase 20: API & Data Layer Cleanup (consolidate API calls, error handling)

- Milestone v1.6 created: Portfolio Valuation Model (dynamic pricing), 4 phases (Phase 21-24)
  - Phase 21: Bullion Premium Pricing (spot + user-defined premium/discount %)
  - Phase 22: Valuation Type System (spot_premium | guide_price | custom)
  - Phase 23: Dynamic Guide Price Integration (numismatic price updates)
  - Phase 24: Portfolio Value Dashboard Updates (display new valuation info)

## Session Continuity

Last session: 2026-01-15
Stopped at: Completed Phase 19 Component Refactor (19-01-PLAN.md)
Resume file: None
