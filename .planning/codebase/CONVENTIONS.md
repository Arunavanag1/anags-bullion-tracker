# Coding Conventions

**Analysis Date:** 2026-01-09

## Naming Patterns

**Files:**
- PascalCase for React components: `Button.tsx`, `AddItemModal.tsx`, `TopPerformers.tsx`
- camelCase with `use` prefix for hooks: `useSpotPrices.ts`, `useCollection.ts`, `usePriceGuide.ts`
- camelCase for utilities: `utils.ts`, `calculations.ts`, `prices.ts`
- kebab-case for multi-word directories: not used (prefer single words)
- route.ts for API handlers in nested folders

**Functions:**
- camelCase for all functions: `fetchSpotPrices`, `calculateCurrentBookValue`
- `use` prefix for hooks: `useSpotPrices()`, `useCollection()`
- `handle` prefix for event handlers: `handleClick`, `handleSubmit`
- No special prefix for async functions

**Variables:**
- camelCase for variables: `portfolioData`, `isLoading`, `spotPrices`
- UPPER_SNAKE_CASE for constants: `CACHE_DURATION_MS`, `TOKEN_KEY`, `API_URL`
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces: `SpotPrice`, `CollectionItem`, `CalculatedValues`
- PascalCase for type aliases: `Metal`, `Category`, `ButtonVariant`
- No `I` prefix for interfaces
- Props interfaces: `{ComponentName}Props`

## Code Style

**Formatting:**
- 2-space indentation
- Semicolons required
- Single quotes for imports (mostly)
- No explicit Prettier config

**Linting:**
- ESLint 9 with `eslint-config-next`
- Config: `bullion-tracker/eslint.config.mjs`
- Extends: `next/core-web-vitals`
- Run: `npm run lint`

**TypeScript:**
- Strict mode enabled (`strict: true`)
- Path alias: `@/*` maps to `./src/*`
- No explicit any (preferred, but some exist)

## Import Organization

**Order:**
1. React imports: `'use client'`, `import React from 'react'`
2. External packages: `next/`, `@tanstack/`, libraries
3. Internal modules: `@/lib/`, `@/components/`
4. Relative imports: `./`, `../`
5. Type imports: `import type { }`

**Grouping:**
- Blank line between groups
- No explicit sorting (manual)

**Path Aliases:**
- Web: `@/*` maps to `./src/*`
- Mobile: No path alias (relative imports)

## Error Handling

**Patterns:**
- Try-catch at API route boundaries
- Return JSON with success flag: `{ success: true/false, data/error }`
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 500 (server error)

**Error Types:**
- Generic Error throws in services
- NextResponse.json for API errors
- Console.error for logging

**Async:**
- async/await pattern throughout
- Try-catch wrapping async operations

## Logging

**Framework:**
- Console.log for normal output
- Console.error for errors
- No structured logging library

**Patterns:**
- Log errors before returning error responses
- Development-only console.log in some places
- No request IDs or correlation

## Comments

**When to Comment:**
- JSDoc-style for public functions: `/** * Fetch current spot prices */`
- Inline comments for complex logic: `// Convert date strings back to Date objects`
- Section comments in large files: `// ─── API CLIENT ───`

**JSDoc/TSDoc:**
- Used for exported functions in lib files
- @param, @returns when helpful
- Not consistently applied everywhere

**TODO Comments:**
- Format: `// TODO: description`
- Example: `// TODO: Implement cloud storage for images`
- No username convention

## Function Design

**Size:**
- No hard limit, but most under 50 lines
- Larger components exist (100-200 lines)
- Extract helpers when logic is repeated

**Parameters:**
- Destructure objects: `({ name, email }: UserProps)`
- Optional params with defaults: `{ variant = 'primary' }`
- No explicit max params rule

**Return Values:**
- Explicit returns
- Return early for guard clauses
- Consistent response shapes in APIs

## Module Design

**Exports:**
- Named exports preferred
- Default exports for page components (Next.js convention)
- Re-export types from `types/index.ts`

**Barrel Files:**
- `types/index.ts` exports all types
- No component barrel files
- Direct imports to specific files

**Component Patterns:**
- Functional components with hooks
- forwardRef for UI primitives: `export const Card = forwardRef<HTMLDivElement, CardProps>(...)`
- Props interfaces defined inline or above component

## React Patterns

**State Management:**
- useState for local state
- TanStack Query for server state
- Context for auth (mobile)

**Data Fetching:**
- useQuery with queryKey arrays
- Custom hooks wrap useQuery
- staleTime: 60000 (1 minute default)
- refetchInterval for live data

**Component Structure:**
```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
// ... imports

interface ComponentProps {
  // props
}

export const Component = ({ prop1, prop2 }: ComponentProps) => {
  // hooks
  const [state, setState] = useState()
  const { data } = useQuery(...)

  // handlers
  const handleClick = () => { ... }

  // render
  return (
    <div>...</div>
  )
}
```

---

*Convention analysis: 2026-01-09*
*Update when patterns change*
