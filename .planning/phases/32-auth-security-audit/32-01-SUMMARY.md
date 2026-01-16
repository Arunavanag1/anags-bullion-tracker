# 32-01-SUMMARY: Auth Security Hardening

## Plan Reference
- **Plan**: 32-01-PLAN.md
- **Phase**: 32 - Auth Security Audit
- **Milestone**: v1.9 Deployment Ready

## Outcome: SUCCESS

All 3 tasks completed successfully. Auth security significantly improved.

## What Was Done

### Task 1: Email Validation in Signup
- Added `validateEmail()` function to `lib/validation.ts`
- Validates: format, single @, domain with dot, max 254 chars (RFC 5321)
- Normalizes: lowercase, trim whitespace
- Updated signup route to use validation and store normalized email
- Commit: `95efb3b`

### Task 2: JWT Expiry & Refresh Endpoint
- Reduced mobile JWT expiry from 30 days to 7 days
- Created `/api/auth/mobile/refresh` endpoint
- Accepts expired tokens within 7-day grace period
- Issues fresh 7-day tokens on successful refresh
- Rate limited like signin (5 per 60s)
- Commit: `282c237`

### Task 3: Email Validation Tests
- Added 24 tests for `validateEmail()` in validation.test.ts
- Coverage: valid formats, normalization, invalid formats, length limits, edge cases
- Total test count: 76 (up from 52)
- Commit: `77dead4`

## Key Decisions

1. **7-day token expiry**: Balance between security (shorter window) and UX (no frequent re-auth)
2. **7-day grace period**: Allows refresh even after token expires, preventing user lockout
3. **Email normalization at signup**: Prevents case-sensitivity issues in lookups
4. **No mobile signin email validation**: Would break existing users; handled at signup only

## Test Results

```
Test Files  3 passed (3)
Tests       76 passed (76)
```

## Files Changed

- `bullion-tracker/src/lib/validation.ts` - Added validateEmail function
- `bullion-tracker/src/app/api/auth/signup/route.ts` - Use email validation
- `bullion-tracker/src/app/api/auth/mobile/signin/route.ts` - 7d expiry
- `bullion-tracker/src/app/api/auth/mobile/refresh/route.ts` - NEW
- `bullion-tracker/src/lib/__tests__/validation.test.ts` - Email tests

## Security Posture Improvement

| Before | After |
|--------|-------|
| 30-day JWT tokens | 7-day tokens with refresh |
| No email validation | RFC-compliant validation |
| Case-sensitive emails | Normalized lowercase |
| No refresh capability | Grace period refresh |

## Next Steps

Phase 32 complete. Ready for Phase 33 (API Hardening).
