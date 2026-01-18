# Phase 49 Research: Cert Lookup API Integration

## Summary

**PCGS**: Has public API with cert lookup - we already have a working client
**NGC**: No public API - actively blocks scraping, only Authorized Dealers get API access

## PCGS Cert Verification API

### What We Already Have
Our existing `PCGSApiClient` (in `coin_scraper/api/pcgs_api.py`) already implements:
- OAuth2 authentication with token caching
- `get_coin_by_cert(cert_no)` method → `/coindetail/GetCoinFactsByCertNo/{cert_no}`
- Quota tracking (1,000 calls/day)
- Retry logic with exponential backoff

### API Details
- **Endpoint**: `GET /coindetail/GetCoinFactsByCertNo/{cert_no}`
- **Auth**: OAuth2 password grant (Bearer token)
- **Rate Limit**: 1,000 calls/day (free tier)
- **Response**: JSON with coin details including:
  - Denomination, date, mintmark
  - Grade
  - Mintage
  - PCGS Price Guide value
  - Population data
  - High-resolution images
  - Auction history

### Response Format
```json
{
  "IsValidRequest": true,
  "ServerMessage": "Request successful",
  "PCGSNo": 12345,
  "CertNo": "12345678",
  "Grade": "MS65",
  "Denomination": "Morgan Dollar",
  "Year": 1921,
  "MintMark": "S",
  "FullName": "1921-S Morgan Dollar",
  // ... additional fields
}
```

### Documentation
- Public API: https://www.pcgs.com/publicapi
- Swagger: https://api.pcgs.com/publicapi/swagger/ui/index

## NGC Cert Verification

### No Public API Available
NGC explicitly states they prevent automated access:
> "This is done to prevent people from browsing or 'crawling' submissions in the NGC Certification Verification database."

### Available Options

1. **Manual Lookup Only**
   - Website: https://www.ngccoin.com/certlookup/
   - Mobile app with barcode scanning

2. **Dealer-Only API**
   - NGC offers Submission Tracking API for Authorized Dealers
   - Not available for general developer use
   - Requires formal business relationship

3. **User-Entered Data**
   - User manually looks up NGC cert and enters data
   - We provide form pre-fills for common fields

## Recommended Implementation Strategy

### Phase 49 Approach

1. **PCGS Autofill (Full Support)**
   - Detect PCGS cert numbers (7-8 digits, often prefixed with pattern)
   - Call existing API client
   - Auto-populate form fields from response

2. **NGC Manual Entry (Partial Support)**
   - Detect NGC cert numbers (7 digits)
   - Show "NGC cert detected" message
   - Provide link to NGC lookup page
   - User manually enters data after verification
   - Consider storing NGC lookup results for future reference

3. **Cert Number Detection**
   - PCGS: 7-8 digit numeric (e.g., `12345678`)
   - NGC: 7 digit numeric (e.g., `1234567`)
   - Both services have different cert number ranges

### API Endpoint to Create

```typescript
// POST /api/coins/cert-lookup
{
  "certNumber": "12345678",
  "service": "pcgs" | "ngc" | "auto"  // auto-detect if not specified
}

// Response
{
  "success": true,
  "service": "pcgs",
  "data": {
    "pcgsNumber": 12345,
    "fullName": "1921-S Morgan Dollar",
    "year": 1921,
    "mintMark": "S",
    "denomination": "Dollar",
    "grade": "MS65",
    "priceGuide": 450.00,
    // ... mapped to our form fields
  }
}
```

## Phase 49 Tasks

1. Create `/api/coins/cert-lookup` endpoint (Next.js API route)
2. Add TypeScript types for PCGS response mapping
3. Implement cert number detection (PCGS vs NGC patterns)
4. Map PCGS response to our CoinReference fields
5. Handle NGC gracefully (link to manual lookup)
6. Add error handling for invalid/not-found certs

## Open Questions

1. Should we cache cert lookup results to save API quota?
2. Do we need to handle other grading services (ANACS, ICG)?
3. Should NGC data entry be a two-step process (verify then enter)?

## Sources

- [PCGS Public API](https://www.pcgs.com/publicapi)
- [PCGS API Documentation](https://www.pcgs.com/publicapi/documentation)
- [NGC Cert Lookup](https://www.ngccoin.com/certlookup/)
- [NGC FAQ on Verification](https://www.ngccoin.com/about/help-center-faqs/ngc-website/verify-ngc-certification/)
- [Collectors Universe Forums](https://forums.collectors.com/discussion/1108764/using-pcgs-public-api-to-get-coin-information)
