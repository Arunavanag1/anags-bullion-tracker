---
phase: 59-us-historical-coinage-rules
plan: 01
subsystem: api
tags: [typescript, numismatics, us-coinage, metal-content, unit-tests]

# Dependency graph
requires:
  - phase: 58-metal-content-data-model
    provides: Metal content fields on CollectionItem (metalPurity, metalWeightOz, preciousMetalOz)
provides:
  - US coinage rules engine utility (detectUSCoinMetalContent function)
  - Auto-detection for pre-1965 silver coins (dimes, quarters, half dollars)
  - Auto-detection for 40% silver Kennedy half dollars (1965-1970)
  - Auto-detection for war nickels (1942-1945)
  - Auto-detection for pre-1933 gold coins ($1, $2.50, $3, $5, $10, $20)
  - Integration with numismatic item creation
  - 37 unit tests covering all coin detection scenarios
affects: [60-cert-lookup-metal-autofill, 61-manual-metal-input-ui, 62-portfolio-metal-aggregation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rules engine for coin specification lookup
    - Priority-based matching (gold coins checked first when denomination suggests gold)
    - Alias-based denomination matching

key-files:
  created:
    - bullion-tracker/src/lib/us-coinage-rules.ts
    - bullion-tracker/src/lib/__tests__/us-coinage-rules.test.ts
  modified:
    - bullion-tracker/src/app/api/collection/route.ts

key-decisions:
  - "Check gold rules first for denominations containing $, 'dollar', 'eagle', or 'gold'"
  - "CoinReference fineness/weightOz takes precedence over rules engine"
  - "Use official US Mint specifications for precious metal content values"

patterns-established:
  - "Rules engine pattern for automatic coin specification detection"
  - "Denomination aliasing for flexible matching (10C, Dime, 10 Cent)"

issues-created: []

# Metrics
duration: 3 min
completed: 2026-01-24
---

# Phase 59 Plan 01: US Historical Coinage Rules Engine Summary

**Rules engine for automatic metal content detection of US historical coins with 37 unit tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T01:47:26Z
- **Completed:** 2026-01-24T01:51:23Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created US coinage rules engine with SILVER_COIN_RULES and GOLD_COIN_RULES arrays
- Implemented detectUSCoinMetalContent function for automatic detection
- Integrated rules engine with POST /api/collection for numismatic items
- Added 37 comprehensive unit tests covering all coin types and edge cases
- Supports pre-1965 silver (dimes, quarters, half dollars), war nickels, 40% Kennedy halves
- Supports all pre-1933 gold denominations ($1, $2.50, $3, $5, $10, $20)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create US coinage rules engine utility** - `906b2db` (feat)
2. **Task 2: Integrate rules engine with numismatic item creation** - `0177ff8` (feat)
3. **Task 3: Add unit tests for US coinage rules engine** - `5e77ec5` (test)

## Files Created/Modified

- `bullion-tracker/src/lib/us-coinage-rules.ts` - Rules engine with USCoinRule interface, coin specifications, and detection function
- `bullion-tracker/src/lib/__tests__/us-coinage-rules.test.ts` - 37 unit tests for detection logic
- `bullion-tracker/src/app/api/collection/route.ts` - Integration with numismatic item creation

## Decisions Made

- Check gold rules first when denomination contains "$", "dollar", "eagle", "gold", or "saint" to prevent silver dollar matching first
- CoinReference data (fineness, weightOz) takes precedence over rules engine for flexibility
- Use US Mint official specifications for preciousMetalOz values (not calculated from weight × purity to avoid floating point issues)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed gold coin detection order**
- **Found during:** Task 3 (Unit testing)
- **Issue:** "5 Dollar" and "10 Dollar" were matching silver dollar rule before gold rules
- **Fix:** Added priority detection pattern `/\$\d|\d+\s*dollar|gold|eagle|saint/i` to check gold rules first
- **Files modified:** bullion-tracker/src/lib/us-coinage-rules.ts
- **Verification:** All 37 tests pass
- **Committed in:** `5e77ec5` (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (bug)
**Impact on plan:** Bug fix was essential for correct gold coin detection. No scope creep.

## Issues Encountered

None.

## Next Phase Readiness

Phase 59 complete. US historical coinage rules engine is ready for:
- Phase 60: Cert Lookup Metal Autofill (will use rules engine as fallback when PCGS API lacks data)
- Phase 61: Manual Metal Input UI (rules engine provides auto-fill suggestions)
- Phase 62: Portfolio Metal Aggregation (preciousMetalOz values now populated automatically)

---
*Phase: 59-us-historical-coinage-rules*
*Completed: 2026-01-24*
