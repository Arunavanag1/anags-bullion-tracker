---
phase: 02-filter-pills
plan: 01
subsystem: ui
tags: [react, gsap, filtering, gallery]

requires:
  - phase: 01-radial-gallery
    provides: RadialScrollGallery component, CollectionPhotoCard
provides:
  - FilterPills component with multi-select metal filtering
  - Integrated filtering in collage page
  - Upright item orientation in radial gallery
affects: [collage, gallery]

tech-stack:
  added: []
  patterns:
    - Filter state managed via Set<Metal> for multi-select
    - Item counts calculated per metal type

key-files:
  created:
    - bullion-tracker/src/components/gallery/FilterPills.tsx
  modified:
    - bullion-tracker/src/components/gallery/index.ts
    - bullion-tracker/src/app/collage/page.tsx
    - bullion-tracker/src/components/gallery/RadialScrollGallery.tsx

key-decisions:
  - "Multi-select filtering: users can select multiple metals simultaneously"
  - "Show item counts on filter buttons for clarity"
  - "Upright orientation: changed startAngle to 270° and counter-rotation to keep items vertical"

patterns-established:
  - "Filter state as Set<T> for efficient multi-select toggle"

issues-created: []

duration: 53min
completed: 2026-01-09
---

# Phase 2 Plan 1: Filter Pills Summary

**Metal type filter pills with item counts, multi-select filtering, and upright gallery orientation**

## Performance

- **Duration:** 53 min
- **Started:** 2026-01-09T02:15:16Z
- **Completed:** 2026-01-09T03:08:15Z
- **Tasks:** 2
- **Files modified:** 4 (+ 8 pre-existing bug fixes)

## Accomplishments

- Created FilterPills component with Gold/Silver/Platinum/All toggle buttons
- Integrated filtering into collage page with real-time gallery updates
- Added item counts per metal type on filter buttons
- Fixed radial gallery orientation so items display upright (vertical)
- Enhanced empty state to distinguish "no photos" from "no matches"

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FilterPills component** - `79f9872` (feat)
2. **Task 2: Integrate filter pills into collage page** - `0542bc7` (feat)

**Bug fixes (pre-existing):** `4d67be1` (fix) - Fixed 8 type errors blocking build

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `bullion-tracker/src/components/gallery/FilterPills.tsx` - New filter component with multi-select support
- `bullion-tracker/src/components/gallery/index.ts` - Export FilterPills
- `bullion-tracker/src/app/collage/page.tsx` - Integrated filtering, updated empty state
- `bullion-tracker/src/components/gallery/RadialScrollGallery.tsx` - Fixed orientation (270° start, upright items)

## Decisions Made

- **Multi-select filtering:** Users can select multiple metals (e.g., Gold + Silver) rather than single-select
- **Filter counts:** Display photo counts per metal type on buttons for user clarity
- **All button behavior:** Clicking "All" clears filters; selecting all 3 metals also clears (equivalent to All)
- **Rotating orientation:** Items rotate with the wheel (pointing outward from center), no counter-rotation during scroll

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing type errors preventing build**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** Multiple pre-existing type errors in FDX routes, collection components, and calculations
- **Fix:** Fixed nullable types, Promise-based params for Next.js 16, type assertions
- **Files modified:** 8 files across api routes and components
- **Verification:** TypeScript compilation passes
- **Committed in:** 4d67be1

**2. [Rule 1 - Bug] Fixed gallery orientation per user preference**
- **Found during:** User feedback during Task 2
- **Issue:** User wanted items to rotate with the wheel, not stay upright
- **Fix:** Items positioned at itemAngle+90 (pointing outward), no counter-rotation during scroll
- **Files modified:** RadialScrollGallery.tsx
- **Verification:** Items rotate naturally with wheel during scroll
- **Committed in:** dd67de7

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug), 0 deferred
**Impact on plan:** Bug fixes necessary for build and correct display. No scope creep.

## Issues Encountered

- Pre-existing type errors in codebase required fixing before filter pills could be tested
- Build fails on /auth/error page during static generation (pre-existing, not blocking dev mode)

## Next Phase Readiness

- Filter Pills feature complete
- v1.1 milestone complete
- Ready for `/gsd:complete-milestone` to archive v1.1

---
*Phase: 02-filter-pills*
*Completed: 2026-01-09*
