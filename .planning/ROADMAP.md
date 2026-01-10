# Roadmap: Radial Photo Gallery

## Milestones

- ✅ [v1.0 Radial Photo Gallery](milestones/v1.0-ROADMAP.md) (Phase 1) — SHIPPED 2026-01-09
- 🚧 **v1.1 Filter Pills** — Phase 2 (in progress)
- 📋 **v1.2 Security & Stability** — Phases 3-9 (planned)
- 📋 **v1.3 Improvements** — Phases 10-12 (complete)
- 📋 **v1.4 Auth Deployment** — Phases 13-16 (planned)

## Overview

Premium scroll-driven radial photo gallery for the Bullion Collection Tracker.

## Completed Phases

<details>
<summary>✅ v1.0 Radial Photo Gallery (Phase 1) — SHIPPED 2026-01-09</summary>

### Phase 1: Radial Gallery
- [x] 01-01: Build radial gallery components and integrate with collage page

</details>

### 🚧 v1.1 Filter Pills (In Progress)

**Milestone Goal:** Add metal type filtering to the radial photo gallery

#### Phase 2: Filter Pills

**Goal**: Add Gold/Silver/Platinum toggle buttons that filter the radial gallery
**Depends on**: Phase 1 (Radial Gallery)
**Research**: Unlikely (internal UI patterns, existing component integration)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD (run /gsd:plan-phase 2 to break down)

### 📋 v1.2 Security & Stability (Planned)

**Milestone Goal:** Address critical security issues, tech debt, and missing features from CONCERNS.md

#### Phase 3: Security Hardening

**Goal**: Fix critical security vulnerabilities
**Depends on**: Phase 2 (Filter Pills)
**Research**: Likely (upstash/ratelimit integration)
**Research topics**: Rate limiting libraries, secure credential management
**Plans**: 2 plans

Plans:
- [x] 03-01: Fix JWT secrets, password requirements, protect seed endpoint
- [x] 03-02: Add rate limiting to auth endpoints

**Scope:**
- Rotate exposed credentials, add .env to gitignore
- Remove default JWT secret fallback (fail hard if missing)
- Protect seed endpoint (dev-only or auth-required)
- Strengthen password requirements (8+ chars, complexity)
- Add rate limiting to auth endpoints

#### Phase 4: Environment Configuration

**Goal**: Proper environment management across platforms
**Depends on**: Phase 3
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [x] 04-01: Fix hardcoded mobile API URL, create comprehensive .env.example files

**Scope:**
- Fix hardcoded mobile API URL
- Environment-specific config for web and mobile
- Proper .env.example files

#### Phase 5: Image Storage Migration

**Goal**: Move base64 images to cloud storage
**Depends on**: Phase 4
**Research**: Likely (cloud storage API integration)
**Research topics**: AWS S3 vs Cloudinary, presigned URLs, migration strategy
**Plans**: 1 plan

Plans:
- [x] 05-01: Cloudinary integration, ImageUploader update, migration script

**Scope:**
- Set up cloud storage (S3 or Cloudinary)
- Migrate existing base64 images
- Update ImageUploader to use URLs instead of base64

#### Phase 6: Test Foundation

**Goal**: Add test coverage for critical paths
**Depends on**: Phase 5
**Research**: Unlikely (established patterns)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD (run /gsd:plan-phase 6 to break down)

**Scope:**
- Set up Vitest
- Test utility functions (lib/calculations, lib/utils)
- Test critical API routes (auth, coins)

#### Phase 7: Auth Enhancements

**Goal**: Add email verification and password reset
**Depends on**: Phase 6
**Research**: Likely (email service integration)
**Research topics**: Email service (SendGrid, Resend), verification tokens, password reset flow
**Plans**: TBD

Plans:
- [ ] 07-01: TBD (run /gsd:plan-phase 7 to break down)

**Scope:**
- Set up email service
- Implement email verification flow
- Implement password reset flow

#### Phase 8: Performance Fixes

**Goal**: Fix performance issues and race conditions
**Depends on**: Phase 7
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD (run /gsd:plan-phase 8 to break down)

**Scope:**
- Fix N+1 queries in price history
- Fix race condition on price updates
- Add pagination to mobile sync

#### Phase 9: Radial Collage Scroll Persistence

**Goal**: Ensure radial collage doesn't disappear after completing clockwise and counter-clockwise rotation
**Depends on**: Phase 8
**Research**: Unlikely (internal GSAP/ScrollTrigger patterns)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD (run /gsd:plan-phase 9 to break down)

**Scope:**
- Fix scroll animation end state behavior
- Ensure items remain visible after full scroll cycle
- Handle ScrollTrigger unpin gracefully

### 📋 v1.3 Improvements (Planned)

**Milestone Goal:** Enhance chart functionality with better controls, additional visualizations, and export capabilities

#### Phase 10: Chart Axis Refinements

**Goal**: Polish Y-axis scale controls, add X-axis date range options
**Depends on**: Phase 9
**Research**: Unlikely (internal Recharts patterns)
**Plans**: 1 plan

Plans:
- [x] 10-01: Add custom date range picker and improve tick formatting

**Scope:**
- Refine Y-axis scale controls (auto/fromZero/custom)
- Add X-axis date range picker
- Improve tick formatting and intervals

#### Phase 11: Additional Visualizations

**Goal**: Add pie/bar charts for allocation, gain/loss breakdown
**Depends on**: Phase 10
**Research**: Unlikely (Recharts already in use)
**Plans**: 1 plan

Plans:
- [x] 11-01: Create AllocationPieChart and GainLossBarChart components

**Scope:**
- Allocation pie chart by metal type
- Gain/loss bar chart
- Performance comparison charts

#### Phase 12: Chart Export

**Goal**: Export charts as images, export data as CSV
**Depends on**: Phase 11
**Research**: Likely (canvas/image export libraries)
**Research topics**: html2canvas, chart image export, CSV generation
**Plans**: 1 plan

Plans:
- [x] 12-01: Add export utilities and export buttons to all charts

**Scope:**
- Export chart as PNG/JPEG
- Export underlying data as CSV
- Share functionality

### 📋 v1.4 Auth Deployment (Planned)

**Milestone Goal:** Fix authentication issues and prepare for production deployment

#### Phase 13: Credential Cleanup

**Goal**: Remove hardcoded credentials and test data, secure environment variables
**Depends on**: None (can start immediately)
**Research**: Unlikely (straightforward cleanup)
**Plans**: 1 plan

Plans:
- [x] 13-01: Remove hardcoded credentials, add security audit documentation

**Scope:**
- Remove hardcoded test credentials from LoginScreen.tsx
- Ensure .env is gitignored (verify no secrets committed)
- Create production .env.example with all required variables
- Document environment variable requirements

#### Phase 14: Mobile Auth Hardening

**Goal**: Fix mobile authentication for production use
**Depends on**: Phase 13
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [ ] 14-01: TBD (run /gsd:plan-phase 14 to break down)

**Scope:**
- Externalize API URL configuration (remove hardcoded localhost)
- Add token refresh mechanism for mobile
- Handle expired token errors gracefully
- Reduce token expiration from 30 days to 7 days

#### Phase 15: Security Headers & CORS

**Goal**: Add production security headers and proper CORS configuration
**Depends on**: Phase 14
**Research**: Likely (Next.js security middleware patterns)
**Research topics**: Next.js security headers, CORS middleware, CSP policies
**Plans**: TBD

Plans:
- [ ] 15-01: TBD (run /gsd:plan-phase 15 to break down)

**Scope:**
- Add security headers middleware (CSP, HSTS, X-Frame-Options)
- Configure CORS for mobile app origin
- Ensure HTTPS enforcement in production
- Add rate limiting persistence with Upstash

#### Phase 16: Deployment Verification

**Goal**: Verify auth works correctly in production-like environment
**Depends on**: Phase 15
**Research**: Unlikely (testing and verification)
**Plans**: TBD

Plans:
- [ ] 16-01: TBD (run /gsd:plan-phase 16 to break down)

**Scope:**
- Test web login/signup flow
- Test mobile login/signup flow
- Verify OAuth flow (if configured)
- Test rate limiting works in production
- Verify token expiration and refresh
- Document deployment checklist

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Radial Gallery | v1.0 | 1/1 | Complete | 2026-01-09 |
| 2. Filter Pills | v1.1 | 0/? | Not started | - |
| 3. Security Hardening | v1.2 | 2/2 | Complete | 2026-01-09 |
| 4. Environment Configuration | v1.2 | 1/1 | Complete | 2026-01-09 |
| 5. Image Storage Migration | v1.2 | 1/1 | Complete | 2026-01-09 |
| 6. Test Foundation | v1.2 | 0/? | Not started | - |
| 7. Auth Enhancements | v1.2 | 0/? | Not started | - |
| 8. Performance Fixes | v1.2 | 0/? | Not started | - |
| 9. Radial Collage Scroll Persistence | v1.2 | 0/? | Not started | - |
| 10. Chart Axis Refinements | v1.3 | 1/1 | Complete | 2026-01-10 |
| 11. Additional Visualizations | v1.3 | 1/1 | Complete | 2026-01-10 |
| 12. Chart Export | v1.3 | 1/1 | Complete | 2026-01-10 |
| 13. Credential Cleanup | v1.4 | 1/1 | Complete | 2026-01-10 |
| 14. Mobile Auth Hardening | v1.4 | 0/? | Not started | - |
| 15. Security Headers & CORS | v1.4 | 0/? | Not started | - |
| 16. Deployment Verification | v1.4 | 0/? | Not started | - |

---
*Updated: 2026-01-10 after Phase 13 (Credential Cleanup) completed*
