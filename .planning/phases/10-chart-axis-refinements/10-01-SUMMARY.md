# Phase 10-01 Summary: Chart Axis Refinements

## Completed: 2026-01-10

## Tasks Completed

### Task 1: Add custom date range picker for X-axis
- Added 'custom' option to TimeRange type
- Updated `usePortfolioHistory` hook to accept params object with optional `customStartDate` and `customEndDate`
- Updated API route `/api/portfolio/history` to accept `startDate` and `endDate` query params
- Added date picker UI with styled inputs matching existing custom scale inputs
- Default dates: last 30 days when custom selected
- Fixed `TIME_RANGE_DAYS` type to be `Partial<Record<TimeRange, number>>` since 'custom' has no fixed days

**Commit:** `be12f59` - feat(chart): add custom date range picker for X-axis

### Task 2: Improve tick formatting and intervals
- Improved Y-axis formatting based on value magnitude:
  - Under $100: show cents ($85.50)
  - $100-$1000: show with comma ($850)
  - $1K-$1M: show as K ($85.5K)
  - $1M+: show as M ($1.5M)
- Added dynamic X-axis tick formatting based on time range:
  - 24H: Hour format
  - 1W: Day name (Mon, Tue)
  - 1M: Date (Jan 5)
  - 1Y: Month only (Jan)
  - 5Y: Month + year (Jan '22)
  - Custom: Intelligently chosen based on day span
- Added `interval="preserveStartEnd"` and `minTickGap={40}` for cleaner tick display
- Fixed formatter function signatures to match Recharts API

**Commit:** `b6447e8` - feat(chart): improve X-axis tick formatting and intervals

## Blocking Issues Resolved

### Next.js 16 Suspense Boundary for useSearchParams
During build, encountered errors requiring Suspense boundary for `useSearchParams()`:
- Fixed `auth/error/page.tsx`: Extracted to `AuthErrorContent`, wrapped in Suspense
- Fixed `auth/signin/page.tsx`: Extracted to `SignInContent`, wrapped in Suspense

These fixes were included in Task 1 commit.

## Files Modified

- `bullion-tracker/src/types/index.ts` - Added 'custom' to TimeRange
- `bullion-tracker/src/hooks/useCollection.ts` - Updated hook params
- `bullion-tracker/src/app/api/portfolio/history/route.ts` - Added date params
- `bullion-tracker/src/components/charts/PortfolioChart.tsx` - Added date picker and formatters
- `bullion-tracker/src/app/page.tsx` - Updated hook call
- `bullion-tracker/src/app/auth/error/page.tsx` - Added Suspense wrapper
- `bullion-tracker/src/app/auth/signin/page.tsx` - Added Suspense wrapper

## Verification

- [x] Custom date range selection works end-to-end
- [x] Y-axis formatting adapts to value magnitude
- [x] X-axis formatting adapts to time range
- [x] No TypeScript errors
- [x] `npm run build` succeeds

## Duration

~25 minutes
