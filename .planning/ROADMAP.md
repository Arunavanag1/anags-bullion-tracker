# Roadmap: Radial Photo Gallery

## Milestones

- ✅ [v1.0 Radial Photo Gallery](milestones/v1.0-ROADMAP.md) (Phase 1) — SHIPPED 2026-01-09
- 🚧 **v1.1 Filter Pills** — Phase 2 (in progress)
- 📋 **v1.2 Security & Stability** — Phases 3-8 (planned)

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD (run /gsd:plan-phase 5 to break down)

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

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Radial Gallery | v1.0 | 1/1 | Complete | 2026-01-09 |
| 2. Filter Pills | v1.1 | 0/? | Not started | - |
| 3. Security Hardening | v1.2 | 2/2 | Complete | 2026-01-09 |
| 4. Environment Configuration | v1.2 | 1/1 | Complete | 2026-01-09 |
| 5. Image Storage Migration | v1.2 | 0/? | Not started | - |
| 6. Test Foundation | v1.2 | 0/? | Not started | - |
| 7. Auth Enhancements | v1.2 | 0/? | Not started | - |
| 8. Performance Fixes | v1.2 | 0/? | Not started | - |

---
*Updated: 2026-01-09 after v1.2 milestone created*
