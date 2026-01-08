# Codebase Concerns

**Analysis Date:** 2026-01-09

## Tech Debt

**Base64 Images in Database:**
- Issue: Images stored as base64 strings directly in PostgreSQL
- Files: `bullion-tracker/src/components/collection/ImageUploader.tsx`
- Why: Rapid prototyping, avoiding cloud storage setup
- Impact: Database bloat, slow queries, no CDN benefits
- Fix approach: Migrate to cloud storage (AWS S3/Cloudinary), store URLs only
- Note: TODO comment at line 245 acknowledges this

**Hardcoded Mobile API URL:**
- Issue: API URL hardcoded to local development IP
- File: `bullion-tracker-mobile/src/lib/api.ts` (line 10)
- Why: Development convenience
- Impact: Mobile app breaks outside development network
- Fix approach: Use environment variables, implement proper config per environment

**No Test Coverage:**
- Issue: Zero test files in codebase
- Files: All of `bullion-tracker/src/`, `bullion-tracker-mobile/src/`
- Why: Rapid development, personal project
- Impact: Regressions go unnoticed, refactoring is risky
- Fix approach: Add Vitest, start with utility functions in `lib/`

## Known Bugs

**Race Condition on Price Updates:**
- Symptoms: Stale prices shown briefly after navigation
- Trigger: Fast navigation between pages while prices are fetching
- Files: `bullion-tracker/src/hooks/useSpotPrices.ts`
- Workaround: React Query eventually refetches
- Root cause: No optimistic updates, relying on stale-while-revalidate

## Security Considerations

**Exposed Credentials in .env:**
- Risk: API keys and secrets visible in repository
- Files: `bullion-tracker/.env` (should be gitignored but contains live values)
- Current mitigation: None - keys are exposed
- Recommendations:
  - Add `.env` to `.gitignore`
  - Rotate all exposed keys immediately
  - Use secrets management (Vercel, 1Password)

**Weak Password Requirements:**
- Risk: Easy to brute-force user accounts
- File: `bullion-tracker/src/app/api/auth/signup/route.ts` (line 17)
- Current mitigation: Minimum 6 characters only
- Recommendations: Require 8+ chars, complexity rules, rate limiting

**No Rate Limiting:**
- Risk: Brute force attacks on auth endpoints, API abuse
- Files: All API routes in `bullion-tracker/src/app/api/`
- Current mitigation: None
- Recommendations: Add rate limiting middleware (upstash/ratelimit)

**Seed Endpoint Accessible:**
- Risk: Data deletion via unauthenticated endpoint
- File: `bullion-tracker/src/app/api/prices/seed/route.ts`
- Current mitigation: None
- Recommendations: Restrict to development or add authentication

**Default JWT Secret Fallback:**
- Risk: Predictable tokens if env var missing
- Files: `bullion-tracker/src/lib/auth.ts`, `bullion-tracker/src/app/api/auth/mobile/signin/route.ts`
- Current mitigation: Fallback string "your-secret-key"
- Recommendations: Fail hard if NEXTAUTH_SECRET not set

## Performance Bottlenecks

**N+1 Queries in Price History:**
- Problem: 6 separate queries for price data
- File: `bullion-tracker/src/lib/prices.ts` (lines 177-190)
- Measurement: Not measured, but adds latency
- Cause: Separate query per metal, per time period
- Improvement path: Single query with groupBy, or batch fetch

**Inefficient Historical Price Loop:**
- Problem: Generates daily estimates in memory loop
- File: `bullion-tracker/src/lib/prices.ts` (lines 431-443)
- Measurement: Could be slow for multi-year ranges
- Cause: Creating estimate for each day individually
- Improvement path: Pre-compute and cache, or paginate

**Large Mobile Coin Sync:**
- Problem: Syncs up to 1000 coins in single request
- File: `bullion-tracker-mobile/src/lib/api.ts` (line 127)
- Measurement: Could timeout on slow connections
- Cause: No pagination
- Improvement path: Implement pagination, incremental sync

## Fragile Areas

**Price Caching Logic:**
- Why fragile: Multiple fallback layers (API → cache → DB → mock)
- File: `bullion-tracker/src/lib/prices.ts`
- Common failures: Silent fallback to stale data without notification
- Safe modification: Add logging at each fallback level, add tests
- Test coverage: None

**Mobile AuthContext:**
- Why fragile: Manages auth state, token refresh, API interception
- File: `bullion-tracker-mobile/src/contexts/AuthContext.tsx`
- Common failures: Token expiration handling, race conditions
- Safe modification: Add error boundaries, comprehensive testing
- Test coverage: None

## Scaling Limits

**PostgreSQL Connections:**
- Current capacity: Connection pooling via Prisma
- Limit: Depends on hosting plan
- Symptoms at limit: Connection timeouts, query failures
- Scaling path: Use connection pooler (PgBouncer), serverless Prisma

**Base64 Image Storage:**
- Current capacity: Works fine for small collections
- Limit: Database size grows quickly (1-2MB per image)
- Symptoms at limit: Slow queries, large backups
- Scaling path: Cloud storage migration (mandatory)

## Dependencies at Risk

**next-auth 5.0.0-beta.30:**
- Risk: Beta version, breaking changes possible
- Impact: Auth flow could break on upgrade
- Migration plan: Monitor for stable release, test upgrades carefully

**React 19:**
- Risk: Very new (19.2.3), ecosystem catching up
- Impact: Some libraries may have compatibility issues
- Migration plan: Monitor for issues, have rollback plan

## Missing Critical Features

**No Email Verification:**
- Problem: Users can register with any email
- Current workaround: Trust email at registration
- Blocks: Email communication, password reset
- Implementation complexity: Medium (need email service)

**No Password Reset:**
- Problem: Users cannot recover accounts
- Current workaround: None (manual database intervention)
- Blocks: User retention
- Implementation complexity: Medium (email + tokens)

**No API Rate Limiting:**
- Problem: Vulnerable to abuse
- Current workaround: None
- Blocks: Production deployment at scale
- Implementation complexity: Low (upstash/ratelimit package)

## Test Coverage Gaps

**All Business Logic:**
- What's not tested: `lib/calculations.ts`, `lib/prices.ts`, `lib/utils.ts`
- Risk: Regressions in value calculations, price formatting
- Priority: High
- Difficulty: Low (pure functions, easy to test)

**API Routes:**
- What's not tested: All routes in `src/app/api/`
- Risk: Auth bypass, data corruption
- Priority: High
- Difficulty: Medium (need database mocking)

**React Hooks:**
- What's not tested: All hooks in `src/hooks/`
- Risk: Data fetching issues, cache problems
- Priority: Medium
- Difficulty: Medium (need React Query mocking)

---

*Concerns audit: 2026-01-09*
*Update as issues are fixed or new ones discovered*
