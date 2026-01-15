# Phase 23 Plan 01: Dynamic Guide Price Integration Summary

**Implemented ItemValueHistory model and value history display for tracking numismatic guide price changes over time.**

## Accomplishments

- Added ItemValueHistory model to track value snapshots with date, value, valueType, and source
- Created POST /api/collection/sync-prices endpoint to update numismaticValue from latest guide and record history
- Created GET /api/collection/[id]/history endpoint to retrieve value history entries
- Added ValueHistoryEntry type to web and mobile types
- Created server-only recordValueHistory helper in lib/value-history.ts
- Added getItemValueHistory and syncPrices methods to mobile API client
- Created ValueHistoryChart component for mobile with simple text-based value history display
- Integrated expandable price history section in CollectionScreen for guide_price items

## Files Created/Modified

- `bullion-tracker/prisma/schema.prisma` - Added ItemValueHistory model and valueHistory relation on CollectionItem
- `bullion-tracker/src/app/api/collection/sync-prices/route.ts` - Created endpoint to sync guide prices
- `bullion-tracker/src/app/api/collection/[id]/history/route.ts` - Created endpoint to get value history
- `bullion-tracker/src/types/index.ts` - Added ValueHistoryEntry interface
- `bullion-tracker/src/lib/value-history.ts` - Created server-only recordValueHistory helper
- `bullion-tracker-mobile/src/types/index.ts` - Added ValueHistoryEntry interface
- `bullion-tracker-mobile/src/lib/api.ts` - Added getItemValueHistory and syncPrices methods
- `bullion-tracker-mobile/src/components/numismatic/ValueHistoryChart.tsx` - Created value history display component
- `bullion-tracker-mobile/src/screens/CollectionScreen.tsx` - Added expandable price history section

## Decisions Made

- Used simple text-based list for ValueHistoryChart instead of charting library (not installed)
- Created server-only file for recordValueHistory to avoid client-side Prisma import issues
- History toggle shows only for NUMISMATIC items with bookValueType='guide_price'
- Sync endpoint prefers greysheet price over pcgs price when both available

## Issues Encountered

- Initial implementation imported prisma into calculations.ts which broke client components - fixed by creating separate server-only value-history.ts
- Pre-existing TypeScript errors in CollageScreen.tsx remain (noted in Phase 21)

## Next Phase Readiness

- Ready for Phase 24: Portfolio Value Dashboard Updates
