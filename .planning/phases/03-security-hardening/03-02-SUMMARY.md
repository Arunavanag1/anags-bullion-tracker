---
phase: 03-security-hardening
plan: 02
subsystem: auth
tags: [rate-limiting, upstash, api-protection, brute-force-prevention]

requires:
  - phase: 03-01
    provides: Hardened JWT secrets and password validation

provides:
  - Rate limiting on auth endpoints (5 req/60s per IP)
  - Graceful dev fallback (no Upstash config needed)
  - 429 responses with Retry-After headers

affects: [auth-endpoints, production-security]

tech-stack:
  added: [@upstash/ratelimit, @upstash/redis]
  patterns: [sliding-window-rate-limit, graceful-degradation]

key-files:
  created:
    - bullion-tracker/src/lib/ratelimit.ts
  modified:
    - bullion-tracker/src/app/api/auth/signup/route.ts
    - bullion-tracker/src/app/api/auth/mobile/signin/route.ts
    - bullion-tracker/.env.example

key-decisions:
  - "Sliding window rate limit (5 req/60s) balances security and usability"
  - "No rate limiting in dev without Upstash config (graceful fallback)"
  - "IP-based limiting via x-forwarded-for or x-real-ip headers"

issues-created: []

duration: 5min
completed: 2026-01-09
---

# Phase 3 Plan 02: Rate Limiting Summary

**Added rate limiting to auth endpoints using @upstash/ratelimit with graceful dev fallback**

## Performance

- **Duration:** 5 min
- **Tasks:** 3
- **Files created:** 1
- **Files modified:** 3

## Accomplishments

- Installed @upstash/ratelimit and @upstash/redis packages
- Created rate limiter utility with sliding window algorithm (5 requests per 60 seconds)
- Added rate limit checks to signup and mobile signin endpoints
- Updated .env.example with Upstash configuration vars
- Graceful fallback: rate limiting disabled in dev without Upstash config

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure upstash/ratelimit** - `dd67de7` (fix)
2. **Task 2: Add rate limiting to auth endpoints** - `7623546` (fix)
3. **Task 3: Update .env.example** - `a0455ae` (docs)

## Files Created/Modified

- `bullion-tracker/src/lib/ratelimit.ts` - Rate limiter utility with getClientIp() and checkRateLimit()
- `bullion-tracker/src/app/api/auth/signup/route.ts` - Added rate limit check at start of POST
- `bullion-tracker/src/app/api/auth/mobile/signin/route.ts` - Added rate limit check at start of POST
- `bullion-tracker/.env.example` - Added UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ADMIN_SEED_KEY

## Decisions Made

- Sliding window algorithm (5 req/60s) chosen for good balance of security and UX
- IP-based identification using x-forwarded-for with fallback to x-real-ip
- Graceful degradation: returns { success: true } when Upstash not configured (dev convenience)
- 429 response includes Retry-After header for proper client handling

## Deviations from Plan

### Pre-existing Issues Found

**1. [Not blocking] Build fails on auth/error page**
- **Found during:** Final verification (npm run build)
- **Issue:** Next.js 16 requires Suspense boundary for useSearchParams() in /auth/error
- **Impact:** Pre-existing issue, not introduced by our changes
- **Verified:** Same error occurs without our changes
- **Action:** Not addressed in this plan (out of scope)

### Deferred Enhancements

None - plan executed without scope additions.

---

**Total deviations:** 1 pre-existing issue noted, 0 introduced
**Impact on plan:** None - TypeScript compiles, rate limiting functional

## Issues Encountered

- Pre-existing build error in auth/error page (useSearchParams missing Suspense boundary)
- Not related to this plan's changes

## Phase 3 Complete

Both plans in Phase 3 (Security Hardening) are now complete:
- 03-01: JWT secrets, password requirements, seed protection ✓
- 03-02: Rate limiting ✓

Ready to proceed to Phase 4: Environment Configuration

---
*Phase: 03-security-hardening*
*Completed: 2026-01-09*
