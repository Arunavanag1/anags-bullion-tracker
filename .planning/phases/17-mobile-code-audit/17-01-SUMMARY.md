---
phase: 17-mobile-code-audit
plan: 01
subsystem: mobile
provides: [mobile-architecture-doc, refactoring-priorities]
affects: [18, 19, 20]
tags: [audit, documentation, mobile]
key-files:
  - bullion-tracker-mobile/MOBILE-ARCHITECTURE.md
---

# Phase 17 Plan 01: Mobile Code Audit Summary

**Comprehensive audit identified 6 large files (>300 lines), 3 duplicated components, and ~60 lines of duplicated code across screens, with clear refactoring priorities for Phases 18-20.**

## Accomplishments

- Audited all 6 screens, 12 components, 5 lib files, 1 context, 1 hook file
- Documented complete directory structure with line counts
- Identified 3 duplicated components (PricePill, TabButton) across 3 screens
- Found ~1000 lines of inline StyleSheet definitions across screen files
- Documented API layer architecture with caching strategies
- Created prioritized refactoring list for Phases 18-20

## Files Created/Modified

- `bullion-tracker-mobile/MOBILE-ARCHITECTURE.md` - Comprehensive architecture documentation (400+ lines)

## Anti-Patterns Found

| Category | Count | Impact |
|----------|-------|--------|
| Large files (>300 lines) | 6 | High - Maintainability |
| Duplicated components | 3 | Medium - ~60 lines duplicated |
| Inline StyleSheet | 4 screens | Medium - ~1000 lines of styles |
| Missing TypeScript types | 5 instances | Low - Type safety |
| Validation mismatch | 1 | Low - Password length (6 vs 8) |

### Largest Files Requiring Attention

| File | Lines | Primary Issue |
|------|-------|---------------|
| AddItemScreen.tsx | 776 | Multi-step form complexity, 180 lines of styles |
| DashboardScreen.tsx | 755 | 3 inline components, 415 lines of styles |
| CollectionScreen.tsx | 666 | Duplicates Dashboard components, 199 lines of styles |
| api.ts | 434 | Mixed concerns (types, caching, API) |

## Refactoring Priorities for Phases 18-20

### Phase 18: State Management Refactor
1. Extract PricePill, TabButton to shared components (~60 lines saved)
2. Create SpotPricesContext to eliminate duplicate fetches
3. Fix TypeScript `any` types in hooks and api.ts

### Phase 19: Component Refactor
1. Split AddItemScreen into step components (4 files)
2. Extract StyleSheet definitions to separate files
3. Create shared TabBar component

### Phase 20: API & Data Layer Cleanup
1. Split api.ts into modules (client, collection, coins, cache)
2. Create ErrorDisplay component for consistent error UI
3. Fix password validation mismatch (6 chars vs 8 chars)

## Key Statistics

| Metric | Value |
|--------|-------|
| Total source lines | ~5,100 |
| Screens | 6 |
| Shared components | 12 |
| Screen-specific components | 4 (duplicated) |
| Contexts | 1 (AuthContext) |
| Custom hooks | 4 |
| Lib files | 5 |

## Next Step

Phase 17 complete, ready for Phase 18 (State Management Refactor)
