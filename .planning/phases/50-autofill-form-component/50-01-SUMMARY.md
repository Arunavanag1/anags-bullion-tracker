# Phase 50 Plan 01: Autofill Form Component Summary

**Added PCGS cert autofill to web app AddItemModal, completing cert lookup integration across both web and mobile platforms.**

## Accomplishments

- Created `useCertLookup` React hook using TanStack Query mutation for API calls
- Integrated cert autofill into web AddItemModal with debounced lookup (800ms)
- Auto-populates grade, metal type, price guide value, and triggers coin search
- Added loading spinner, success checkmark, and error messages
- NGC requests show yellow alert with "Open NGC Lookup" link

## Files Created/Modified

### Created:
- `bullion-tracker/src/hooks/useCertLookup.ts` - React hook for cert lookup mutation

### Modified:
- `bullion-tracker/src/components/collection/AddItemModal.tsx` - Added cert autofill to graded coin form

## Decisions Made

1. **Mutation over Query**: Used `useMutation` instead of `useQuery` since cert lookup is triggered on-demand, not cached by cert number
2. **Search trigger**: On successful lookup, triggers coin search by PCGS number to populate coin selection dropdown
3. **UI consistency**: Matched mobile app styling (loading spinner, success checkmark, NGC alert)

## Issues Encountered

None - straightforward port of mobile functionality to web.

## Technical Details

### Autofill Behavior (Web):
- PCGS: 7-8 digit cert number triggers lookup after 800ms debounce
- On success: Populates grade, metal type, price guide value, triggers coin search
- NGC: Shows yellow alert with "Open NGC Lookup" button linking to ngccoin.com
- Users can override any auto-filled values

### Hook Usage:
```typescript
const certLookup = useCertLookup();

// Trigger lookup
certLookup.mutate({ certNumber: '12345678', service: 'pcgs' });

// Check status
certLookup.isPending // Loading state
certLookup.data?.success // Success check
certLookup.data?.data // Coin details
```

## Next Phase Readiness

Ready for Phase 51: Mobile Cert Scanner (barcode/QR scanning)

---
*Phase: 50-autofill-form-component*
*Plan: 01*
