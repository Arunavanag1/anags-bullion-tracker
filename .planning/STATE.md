# Project State

## Current Position

Phase: 52 of 53 (Privacy Policy Page) - COMPLETE
Plan: 1 of 1 in current phase - COMPLETE
Status: In progress
Last activity: 2026-01-19 - Completed 52-01 (Privacy Policy Page)

Progress: v2.3 █████░░░░░ 50% (1/2 phases)

## Active Milestone

**v2.3 App Store Legal** - Phases 52-53

Goal: Add privacy policy and contact/support pages required for App Store submission (Guidelines 2.1 & 5.1)

Phases:
- Phase 52: Privacy Policy Page - COMPLETE
- Phase 53: Contact & Support Page - Not started

## Shipped Milestones

- **v2.2 Cert Number Autofill** (2026-01-18) - PCGS/NGC cert lookup, form autofill, mobile scanner
- **v2.1 Coin Database Expansion** (2026-01-18) - PCGS API, search, validation
- **v2.0 Mobile Charts** (2026-01-18) - Victory Native charts with interactions, dashboard integration
- **v1.9 Deployment Ready** (2026-01-17) - Testing, security, performance, deployment config
- See `.planning/MILESTONES.md` for full history

## Session Continuity

Last session: 2026-01-19
Stopped at: Completed 52-01 (Privacy Policy Page)
Resume file: None
Next: `/gsd:plan-phase 53` (Contact & Support Page)

## Accumulated Context

### Key Decisions (v2.3)
- Standard privacy policy template for collection tracking app (Phase 52)
- Footer links on web and mobile for App Store compliance (Phase 52)
- Mobile links use Linking API to open web URLs (Phase 52)

### Key Decisions (v2.2)
- TypeScript over Python for PCGS API client (Phase 49)
- 800ms debounce for cert lookup (Phase 49, 50)
- Mutation over Query for cert lookup - on-demand (Phase 50)
- Multi-format barcode support for PCGS/NGC labels (Phase 51)
- Full-screen modal for scanner UX (Phase 51)

### Key Decisions (v1.9)
- 7-day JWT tokens with refresh (Phase 32)
- Email normalization at signup (Phase 32)
- CSP allows unsafe-inline for Next.js dev (Phase 33)
- Centralized API error handling (Phase 33)
- Cursor-based pagination (Phase 34)
- Sentry conditionally initialized (Phase 36)
- Vercel iad1 region as primary (Phase 36)

### Technical Debt Resolved (v1.9)
- 76 tests added (Phase 31)
- Auth hardened with JWT expiry (Phase 32)
- Security headers and rate limiting (Phase 33)
- N+1 queries fixed, pagination added (Phase 34)
- TypeScript strict types (Phase 35)
- Deployment configuration complete (Phase 36)

### Known Issues
- next-auth 5 beta may have breaking changes
- No email verification
- No password reset flow

## Blockers/Concerns

None currently.

## Roadmap Evolution

- v1.0-v1.8: Core feature development (Phases 1-30)
- v1.9: Deployment readiness (Phases 31-36) - **SHIPPED 2026-01-17**
- v2.0: Mobile Charts (Phases 37-42) - **SHIPPED 2026-01-18**
- v2.1: Coin Database Expansion (Phases 43-48) - **SHIPPED 2026-01-18**
- v2.2: Cert Number Autofill (Phases 49-51) - **SHIPPED 2026-01-18**
- v2.3: App Store Legal (Phases 52-53) - In progress
