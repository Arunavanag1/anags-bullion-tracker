# Phase 27 Bug Report

## Testing Session: iOS Device Testing
**Date:** 2026-01-16
**Device:** iOS (Expo Go)
**Tester:** User

---

## Bugs Found & Fixed

### Bug #1: Inconsistent Card Spacing on Dashboard
**Severity:** Minor (UI)
**Location:** `DashboardScreen.tsx`

**Description:** The Top Performers and Allocation cards did not have consistent spacing compared to the Portfolio card. The spacing between cards was uneven.

**Fix Applied:**
- Added `marginBottom: 16` to `allocationCard` style
- Added `marginTop: 16` to TopPerformers Card component

**Files Modified:**
- `bullion-tracker-mobile/src/screens/DashboardScreen.tsx`
- `bullion-tracker-mobile/src/components/TopPerformers.tsx`

---

### Bug #2: Daily Gain/Total Return Values Wrapping to Two Lines
**Severity:** Major (UI/UX)
**Location:** `DashboardScreen.tsx`

**Description:** The daily gain and daily total return values were displaying over two lines, with the sign (+/-) on one line and the numeric value on the second line. This made the metrics difficult to read.

**Root Cause:** Font size (20px) was too large for the available space, causing text to wrap.

**Fix Applied:**
- Reduced `metricValue` fontSize from 20 to 16

**Files Modified:**
- `bullion-tracker-mobile/src/screens/DashboardScreen.tsx`

---

### Bug #3: Missing Return Display on Collection Cards
**Severity:** Major (Feature Gap)
**Location:** `CollectionScreen.tsx`

**Description:** Individual coin/bullion cards in the "My Collection" section did not show the return to date for each item.

**Fix Applied:**
- Added "Return:" row to each collection item card
- Shows gain/loss with color coding (green for positive, red for negative)
- Displays both dollar amount and percentage

**Files Modified:**
- `bullion-tracker-mobile/src/screens/CollectionScreen.tsx`

---

### Bug #4: Incorrect Total Return Calculation
**Severity:** Critical (Data Accuracy)
**Location:** `calculations.ts`

**Description:** The total return calculation was comparing melt value to book value, which doesn't represent actual investment return. Total return should compare current value to what was originally paid.

**Root Cause:** Formula was `totalMeltValue - totalBookValue` instead of comparing to purchase cost.

**Fix Applied:**
- Added `totalPurchaseCost` accumulator to track cost basis
- Changed calculation to `totalBookValue - totalPurchaseCost`
- For each item, purchase cost is determined by:
  - `purchasePrice` if set, OR
  - `customBookValue` if set, OR
  - `spotPriceAtCreation × weight × quantity` (cost basis at acquisition)

**Files Modified:**
- `bullion-tracker-mobile/src/lib/calculations.ts`

---

## Summary

| Bug # | Severity | Status |
|-------|----------|--------|
| 1 | Minor | Fixed |
| 2 | Major | Fixed |
| 3 | Major | Fixed |
| 4 | Critical | Fixed |

**Total Bugs Found:** 4
**Fixed:** 4
**Pending:** 0

---

## Regression Testing Required

After fixes are verified, the following should be re-tested:
- [ ] Dashboard card spacing looks consistent
- [ ] Daily gain and total return display on single lines
- [ ] Collection cards show return value for each item
- [ ] Total return calculation reflects actual investment performance
- [ ] All other dashboard functionality still works
