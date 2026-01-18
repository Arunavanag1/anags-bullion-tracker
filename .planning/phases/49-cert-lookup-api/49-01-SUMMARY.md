# Phase 49 Plan 01: Cert Lookup API Integration Summary

**Implemented PCGS cert number autofill with NGC manual lookup fallback for numismatic form.**

## Accomplishments

- Created TypeScript PCGS API client (`src/lib/pcgs-api.ts`) with OAuth2 authentication, token caching, retry logic
- Built `/api/coins/cert-lookup` endpoint supporting PCGS API integration and NGC fallback
- Added `lookupCertNumber()` function to mobile API layer with error handling
- Enhanced NumismaticForm with debounced cert lookup, auto-populate fields (grade, metal, price, coin), loading states
- NGC requests return manual lookup URL (no public API available)

## Files Created/Modified

### Created:
- `bullion-tracker/src/lib/pcgs-api.ts` - TypeScript PCGS API client
- `bullion-tracker/src/app/api/coins/cert-lookup/route.ts` - Cert lookup API endpoint

### Modified:
- `bullion-tracker-mobile/src/lib/api.ts` - Added `CertLookupResponse`, `CertLookupData` types and `lookupCertNumber()` function
- `bullion-tracker-mobile/src/components/addItem/NumismaticForm.tsx` - Added autofill functionality with loading/success/error states, NGC lookup button

## Decisions Made

1. **TypeScript over Python for API client**: Created native TS client instead of spawning Python process - simpler deployment, no cross-language IPC
2. **Debounce timing**: 800ms debounce for cert lookup to avoid excessive API calls
3. **Auto-populate strategy**: Grade, metal, price guide, and coin reference all auto-filled from PCGS response
4. **NGC fallback**: Shows info message with button to open NGC lookup page in browser

## Issues Encountered

None - implementation proceeded smoothly.

## Technical Details

### PCGS API Client Features:
- OAuth2 password grant authentication
- In-memory token caching with 5-minute expiry buffer
- Max 3 retries with exponential backoff
- Custom error classes: `PCGSApiError`, `AuthenticationError`, `RateLimitError`, `CertNotFoundError`

### Autofill Behavior:
- PCGS: 7-8 digit cert number triggers lookup after 800ms debounce
- On success: Populates grade, metal type, price guide value, matched coin
- NGC: Shows yellow alert with "Open NGC Lookup" button
- Users can override any auto-filled values

### API Response Format:
```typescript
interface CertLookupResponse {
  success: boolean;
  service: 'pcgs' | 'ngc';
  requiresManualLookup?: boolean;
  lookupUrl?: string;
  data?: {
    pcgsNumber: number;
    fullName: string;
    grade: string;
    metal: string | null;
    priceGuide: number | null;
    matchedCoinId: string | null;
  };
}
```

## Next Phase Readiness

Ready for Phase 50: Autofill Form Component (may be simplified given current implementation scope)

---
*Phase: 49-cert-lookup-api*
*Plan: 01*
