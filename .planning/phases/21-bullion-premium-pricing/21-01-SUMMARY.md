# Phase 21 Plan 01: Bullion Premium Pricing Summary

**Added premium/discount percentage field for bullion items, enabling portfolio value calculation as spot × weight × (1 + premium%).**

## Accomplishments

- Added `premiumPercent` field to CollectionItem database schema with default value 0
- Updated `calculateCurrentBookValue` function to apply premium multiplier for spot-valued bullion items
- Updated API routes to accept premiumPercent on create and update
- Added premium input field to mobile BullionForm
- Changed mobile bullion items to use `bookValueType: 'spot'` (previously 'custom') to leverage premium pricing

## Files Created/Modified

- `bullion-tracker/prisma/schema.prisma` - Added premiumPercent Float field to CollectionItem
- `bullion-tracker/src/types/index.ts` - Added premiumPercent to ItemizedPiece and BulkWeight interfaces
- `bullion-tracker/src/lib/calculations.ts` - Updated calculateCurrentBookValue to handle premium percentage
- `bullion-tracker/src/app/api/collection/route.ts` - Added premiumPercent to bullion create data
- `bullion-tracker/src/app/api/collection/[id]/route.ts` - Added premiumPercent to update data
- `bullion-tracker-mobile/src/lib/api.ts` - Added premiumPercent to CollectionItem interface
- `bullion-tracker-mobile/src/components/addItem/BullionForm.tsx` - Added premium input field and state
- `bullion-tracker-mobile/src/screens/AddItemScreen.tsx` - Added premiumPercent handling for create/edit

## Decisions Made

- Used `prisma db push` instead of migrations since the project doesn't have an existing migrations directory
- Changed new bullion items to use `bookValueType: 'spot'` to take advantage of premium pricing (previously used 'custom')
- Premium percentage stored as float (e.g., 5 for 5%, -3 for -3% discount)

## Issues Encountered

- Database drift detected when trying to run migrations; resolved by using `prisma db push` for development
- Pre-existing TypeScript errors in CollageScreen.tsx unrelated to this phase (not fixed)

## Next Phase Readiness

- Ready for Phase 22: Valuation Type System
