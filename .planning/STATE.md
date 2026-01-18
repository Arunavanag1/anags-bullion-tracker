# Project State

## Current Position

Phase: 49 of 51 (Cert Lookup API Integration)
Plan: 1 of 1 in current phase
Status: Ready to execute
Last activity: 2026-01-18 - Created 49-01-PLAN.md

Progress: v2.2 ░░░░░░░░░░ 0% (0/3 phases)

## Active Milestone

**v2.2 Cert Number Autofill** (Phases 49-51)
- 3 phases planned
- Focus: Add autofill for coins using PCGS/NGC cert numbers
- Approach: API integration + form component + mobile scanner

## Shipped Milestones

- **v2.1 Coin Database Expansion** (2026-01-18) - PCGS API, search, validation
- **v2.0 Mobile Charts** (2026-01-17) - Victory Native charts on mobile (Phases 37-40 complete, 41-42 pending)
- **v1.9 Deployment Ready** (2026-01-17) - Testing, security, performance, deployment config
- See `.planning/MILESTONES.md` for full history

## Session Continuity

Last session: 2026-01-18
Stopped at: Created 49-01-PLAN.md for Cert Lookup API
Resume file: None
Next: `/gsd:execute-plan .planning/phases/49-cert-lookup-api/49-01-PLAN.md`

## Accumulated Context

### Key Decisions (v1.9)
- 7-day JWT tokens with refresh (Phase 32)
- Email normalization at signup (Phase 32)
- CSP allows unsafe-inline for Next.js dev (Phase 33)
- Centralized API error handling (Phase 33)
- Cursor-based pagination (Phase 34)
- Sentry conditionally initialized (Phase 36)
- Vercel iad1 region as primary (Phase 36)

### Technical Debt Resolved (v1.9)
- ✅ 76 tests added (Phase 31)
- ✅ Auth hardened with JWT expiry (Phase 32)
- ✅ Security headers and rate limiting (Phase 33)
- ✅ N+1 queries fixed, pagination added (Phase 34)
- ✅ TypeScript strict types (Phase 35)
- ✅ Deployment configuration complete (Phase 36)

### Known Issues
- next-auth 5 beta may have breaking changes
- No email verification
- No password reset flow

## Blockers/Concerns

None currently.

## Roadmap Evolution

- v1.0-v1.8: Core feature development (Phases 1-30)
- v1.9: Deployment readiness (Phases 31-36) - **SHIPPED 2026-01-17**
- v2.0: Mobile Charts (Phases 37-42) - In Progress
- v2.1: Coin Database Expansion (Phases 43-48) - Created 2026-01-17

### v2.1 Milestone Context
- **Goal**: Expand coin reference database from ~100 to ~5,830 coins
- **Approach**: PCGS API (1,000 free queries/day) - web scraping blocked
- **Coverage**: 67 series across 4 priority tiers (P0-P3)
- **Current state**: 100 coins, price refresh automation complete
- **Phase 47**: Created refresh_prices.py + Vercel cron for automated updates
