# External Integrations

**Analysis Date:** 2026-01-09

## APIs & External Services

**Metal Pricing:**
- Metal Price API (metalpriceapi.com) - Live spot prices for gold, silver, platinum
  - SDK/Client: REST API via fetch
  - Auth: API key in `METAL_PRICE_API_KEY` env var
  - Endpoints: `/v1/latest` (spot), `/v1/timeframe` (historical)
  - Files: `bullion-tracker/src/lib/prices.ts`, `bullion-tracker-mobile/src/lib/prices.ts`
  - Caching: 8-hour cache (web), 12-hour cache with AsyncStorage (mobile)

**Web Scraping:**
- PCGS (Professional Coin Grading Services) - Coin price guides
  - Integration method: cheerio HTML parsing
  - Endpoint: `https://www.pcgs.com/prices/{pcgsNumber}`
  - Files: `bullion-tracker/scripts/scrape-pcgs-prices.ts`

## Data Storage

**Databases:**
- PostgreSQL - Primary data store (web)
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM 7.2.0 with `@prisma/adapter-pg`
  - Migrations: `bullion-tracker/prisma/migrations/`
  - Schema: `bullion-tracker/prisma/schema.prisma`

- SQLite (mobile only)
  - Package: expo-sqlite 16.0.10
  - Purpose: Local offline data storage
  - File: `bullion-tracker-mobile/src/lib/api.ts`

**File Storage:**
- Base64 in database (current)
  - Images stored as base64 strings in PostgreSQL
  - Files: `bullion-tracker/src/components/collection/ImageUploader.tsx`
  - Note: TODO comment acknowledges need for cloud storage (AWS S3/Cloudinary)

**Caching:**
- In-memory cache (web) - 8-hour TTL for spot prices
- AsyncStorage (mobile) - Key-value caching for API responses
- expo-secure-store (mobile) - Secure token storage

## Authentication & Identity

**Auth Provider:**
- NextAuth 5.0.0-beta.30 - Email/password + OAuth
  - Implementation: `bullion-tracker/src/auth.ts`, `bullion-tracker/src/lib/auth.ts`
  - Token storage: JWT session strategy
  - Session management: JWT with refresh tokens
  - Adapter: Prisma adapter for DB persistence

**OAuth Integrations:**
- Google OAuth (optional)
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Scopes: email, profile
  - File: `bullion-tracker/src/auth.ts`

**Custom OAuth (Plaid/FDX/Monarch):**
- Files:
  - `bullion-tracker/src/lib/plaid/oauth-tokens.ts`
  - `bullion-tracker/src/lib/plaid/jwks.ts`
- Endpoints:
  - `/api/oauth/authorize` - Authorization
  - `/api/oauth/token` - Token exchange
  - `/api/oauth/userinfo` - User info
  - `/api/.well-known/openid-configuration` - OIDC discovery
  - `/api/.well-known/jwks.json` - JWKS for validation
- Features: RS256 JWT signing, PKCE support, authorization code flow

## Monitoring & Observability

**Error Tracking:**
- Not detected - console.log/console.error only

**Analytics:**
- Not detected

**Logs:**
- Console output only
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured
- Compatible with: Vercel (Next.js), any Node.js hosting

**CI Pipeline:**
- Not detected - No GitHub Actions or similar

## Environment Configuration

**Development:**
- Required env vars: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, METAL_PRICE_API_KEY
- Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- Secrets location: `.env.local` (gitignored)
- Mobile API: Hardcoded to `http://192.168.100.102:3001` (needs env var)

**Production:**
- Secrets management: Environment variables (platform-specific)
- Database: PostgreSQL with Prisma

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## API Routes (Internal)

**Authentication:**
- `/api/auth/[...nextauth]` - NextAuth handlers
- `/api/auth/signup` - User registration
- `/api/auth/mobile/signin` - Mobile JWT signin

**Collection Management:**
- `/api/collection` - GET (list), POST (create)
- `/api/collection/[id]` - GET, PATCH, DELETE
- `/api/collection/summary` - Aggregated stats

**Prices:**
- `/api/prices` - Current spot prices
- `/api/prices/history` - Historical data
- `/api/prices/performance` - Performance metrics
- `/api/prices/seed` - Seed historical data (development)

**Portfolio:**
- `/api/portfolio/summary` - Portfolio totals
- `/api/portfolio/history` - Historical snapshots

**Numismatic/Coins:**
- `/api/coins/search` - Search coin references
- `/api/coins/[pcgsNumber]` - Individual coin
- `/api/coins/price-guide` - Price guide data
- `/api/coins/performance` - Performance metrics

**FDX Integration:**
- `/api/fdx/v6/accounts` - List accounts
- `/api/fdx/v6/accounts/[accountId]` - Account details
- `/api/fdx/v6/accounts/[accountId]/transactions` - Transactions

---

*Integration audit: 2026-01-09*
*Update when adding/removing external services*
