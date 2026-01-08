# Testing Patterns

**Analysis Date:** 2026-01-09

## Test Framework

**Runner:**
- Not currently configured
- No Jest, Vitest, or other test runner installed

**Assertion Library:**
- Not installed

**Run Commands:**
```bash
# No test commands configured
# package.json scripts do not include test commands
```

## Test File Organization

**Location:**
- No test files exist in the codebase
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx` files found
- No `__tests__/` directories

**Naming:**
- Not established (recommendation: `*.test.ts` co-located with source)

**Structure:**
- Not established

## Test Structure

**Suite Organization:**
- Not established

**Patterns:**
- Not established

## Mocking

**Framework:**
- Not configured

**Patterns:**
- Not established

## Fixtures and Factories

**Test Data:**
- Not established

**Location:**
- Not established

## Coverage

**Requirements:**
- No coverage requirements set
- No coverage tools configured

**Configuration:**
- Not configured

## Test Types

**Unit Tests:**
- Not implemented

**Integration Tests:**
- Not implemented

**E2E Tests:**
- Not implemented

## Testable Code Areas

The codebase has good separation that would support testing:

**Unit Test Candidates (High Priority):**
- `bullion-tracker/src/lib/utils.ts`
  - `cn()` - CSS class merging
  - `debounce()` - Debounce logic
  - `generateId()` - ID generation
  - `isValidImage()`, `isValidFileSize()` - File validation

- `bullion-tracker/src/lib/calculations.ts`
  - `calculateCurrentMeltValue()`
  - `calculateCurrentBookValue()`
  - `formatCurrency()`, `formatPercentage()`, `formatWeight()`

- `bullion-tracker/src/lib/prices.ts`
  - Price caching logic
  - Historical price interpolation

**Integration Test Candidates:**
- `bullion-tracker/src/app/api/collection/route.ts` - Collection CRUD
- `bullion-tracker/src/app/api/prices/route.ts` - Price fetching
- `bullion-tracker/src/app/api/auth/signup/route.ts` - User registration

**Hook Test Candidates:**
- `bullion-tracker/src/hooks/useSpotPrices.ts`
- `bullion-tracker/src/hooks/useCollection.ts`
- `bullion-tracker/src/hooks/usePortfolioSummary.ts`

## Recommended Test Setup

**Framework Recommendation:**
- Vitest (recommended for Next.js + TypeScript)

**Dependencies to Add:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

**Configuration File:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

**Proposed Directory Structure:**
```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
├── hooks/
│   ├── useSpotPrices.ts
│   └── useSpotPrices.test.ts
└── __tests__/
    └── api/
        └── collection.test.ts
```

## Testing Priority

1. **Phase 1**: Utility functions in `lib/` (quick wins)
2. **Phase 2**: Custom hooks with mocked React Query
3. **Phase 3**: API route integration tests
4. **Phase 4**: Component tests
5. **Phase 5**: E2E tests with Playwright

---

*Testing analysis: 2026-01-09*
*Update when test patterns change*
