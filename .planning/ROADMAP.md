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
- :construction: **v1.9 Deployment Ready** - Phases 31-36 (in progress)

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

### :construction: v1.9 Deployment Ready (In Progress)

**Milestone Goal:** Vigorous code review and hardening for production deployment

#### Phase 31: Test Foundation
**Goal**: Set up Vitest testing framework, write critical path tests for auth, API, and calculations
**Depends on**: Phase 30 (or can run in parallel)
**Research**: Unlikely (established patterns)
**Plans**: 3 plans

Plans:
- [ ] 31-01: Vitest setup and configuration
- [ ] 31-02: TDD for calculation functions (book value, melt value, purchase price)
- [ ] 31-03: TDD for validation and summary functions

#### Phase 32: Auth Security Audit
**Goal**: Review authentication flow, fix vulnerabilities, document security posture
**Depends on**: Phase 31
**Research**: Unlikely (internal review)
**Plans**: TBD

Plans:
- [ ] 32-01: TBD

#### Phase 33: API Hardening
**Goal**: Comprehensive error handling, input validation, security headers, CORS config
**Depends on**: Phase 32
**Research**: Unlikely (established patterns)
**Plans**: TBD

Plans:
- [ ] 33-01: TBD

#### Phase 34: Performance Review
**Goal**: Fix N+1 queries, add pagination, optimize bundle size, improve load times
**Depends on**: Phase 33
**Research**: Unlikely (internal optimization)
**Plans**: TBD

Plans:
- [ ] 34-01: TBD

#### Phase 35: Code Quality Sweep
**Goal**: ESLint strict mode, remove dead code, fix all TypeScript issues, document patterns
**Depends on**: Phase 34
**Research**: Unlikely (internal cleanup)
**Plans**: TBD

Plans:
- [ ] 35-01: TBD

#### Phase 36: Deployment Verification
**Goal**: Environment configs, health checks, logging, monitoring setup, deployment runbook
**Depends on**: Phase 35
**Research**: Likely (monitoring/logging tools)
**Research topics**: Vercel monitoring, Sentry integration, logging best practices
**Plans**: TBD

Plans:
- [ ] 36-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order. v1.8 and v1.9 can partially overlap (testing can start while mobile deployment continues).

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 28. Performance & Error Handling | v1.8 | 0/? | In progress | - |
| 29. App Store Build | v1.8 | 0/? | Not started | - |
| 30. Final QA | v1.8 | 0/? | Not started | - |
| 31. Test Foundation | v1.9 | 0/3 | In progress | - |
| 32. Auth Security Audit | v1.9 | 0/? | Not started | - |
| 33. API Hardening | v1.9 | 0/? | Not started | - |
| 34. Performance Review | v1.9 | 0/? | Not started | - |
| 35. Code Quality Sweep | v1.9 | 0/? | Not started | - |
| 36. Deployment Verification | v1.9 | 0/? | Not started | - |
