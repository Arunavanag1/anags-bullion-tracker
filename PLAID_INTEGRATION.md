# Bullion Tracker - Plaid Core Exchange Integration

## Overview

This integration allows your bullion collection to appear in net worth trackers like Monarch Money, Copilot, and other apps that use Plaid for account aggregation.

## How It Works

1. Users open Monarch Money (or similar app)
2. Search for "BullionTracker" as an institution
3. Authenticate with their BullionTracker credentials
4. Grant permission for the app to access their portfolio
5. Their bullion value appears as an investment account in the aggregator

## Architecture

```
┌────────────────┐     OAuth 2.0 + OIDC      ┌──────────────────┐
│ BullionTracker │◄────────────────────────►│      Plaid       │
│  Auth Server   │                           │   (DAP Client)   │
│  (OIDC Provider)│                          └────────┬─────────┘
└────────────────┘                                    │
         │                                            │
         │ Issues JWT tokens                          │ Calls FDX API
         ▼                                            ▼
┌────────────────┐                           ┌──────────────────┐
│ BullionTracker │◄──────────────────────────│   Aggregator     │
│  FDX API       │   GET /accounts, etc.     │   (Monarch, etc) │
│  (Resource Server)│                         └──────────────────┘
└────────────────┘
```

## Implementation

### OAuth 2.0 + OpenID Connect Endpoints

✅ **OIDC Discovery**
- Endpoint: `GET /.well-known/openid-configuration`
- Returns OAuth metadata

✅ **JWKS (Public Keys)**
- Endpoint: `GET /.well-known/jwks.json`
- Returns RSA public keys for JWT verification

✅ **Authorization**
- Endpoint: `GET /api/oauth/authorize`
- User login and consent screen
- Returns authorization code

✅ **Token Exchange**
- Endpoint: `POST /api/oauth/token`
- Exchanges code for access/refresh tokens
- Supports PKCE

✅ **User Info**
- Endpoint: `GET /api/oauth/userinfo`
- Returns authenticated user details

### FDX API Endpoints

✅ **List Accounts**
- Endpoint: `GET /api/fdx/v6/accounts`
- Returns investment account(s)

✅ **Account Details**
- Endpoint: `GET /api/fdx/v6/accounts/{accountId}`
- Returns holdings (gold, silver, platinum)
- Includes current spot values

✅ **Transactions**
- Endpoint: `GET /api/fdx/v6/accounts/{accountId}/transactions`
- Returns purchase history

## Setup Instructions

### 1. Generate OAuth Keys

The system will auto-generate keys for development. For production:

```bash
# Generate RSA key pair
openssl genrsa -out oauth_private.pem 2048
openssl rsa -in oauth_private.pem -pubout -out oauth_public.pem

# Add to .env
OAUTH_PRIVATE_KEY="$(cat oauth_private.pem)"
OAUTH_PUBLIC_KEY="$(cat oauth_public.pem)"
OAUTH_KEY_ID="bulliontracker-key-2025"
```

### 2. Create OAuth Client for Plaid

```bash
# Run the seeding script
npx tsx scripts/seed-oauth-client.ts
```

This will output:
- Client ID: `plaid-exchange`
- Client Secret: (randomly generated - save this!)

### 3. Configure Environment Variables

Add to `.env`:

```env
# OAuth Configuration
NEXT_PUBLIC_API_URL=https://api.bulliontracker.app
OAUTH_KEY_ID=bulliontracker-key-2025

# Optional: Override in production
OAUTH_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
OAUTH_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

### 4. Apply to Plaid Core Exchange

1. Visit: https://plaid.com/products/core-exchange/#contactForm
2. Provide your endpoints:
   - **OIDC Discovery**: `https://api.bulliontracker.app/.well-known/openid-configuration`
   - **FDX Base URL**: `https://api.bulliontracker.app/api/fdx/v6`
3. Complete technical validation
4. Get listed in Plaid Link

### 5. Testing Before Plaid Approval

Test the OAuth flow manually:

```bash
# 1. Open authorization URL in browser
open "https://api.bulliontracker.app/api/oauth/authorize?\
response_type=code&\
client_id=plaid-exchange&\
redirect_uri=http://localhost:8080/callback&\
scope=openid%20profile%20accounts:read&\
state=random123"

# 2. After redirect, exchange code for tokens
curl -X POST https://api.bulliontracker.app/api/oauth/token \
  -u "plaid-exchange:YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code" \
  -d "code=CODE_FROM_STEP_1" \
  -d "redirect_uri=http://localhost:8080/callback"

# 3. Call FDX API with access token
curl https://api.bulliontracker.app/api/fdx/v6/accounts \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Security Features

✅ **JWT Access Tokens** - RS256 signed, verifiable by Plaid
✅ **PKCE Support** - Code challenge/verifier for enhanced security
✅ **Refresh Token Rotation** - Tokens rotate on each use
✅ **Short-lived Access Tokens** - 1 hour expiration
✅ **Long-lived Refresh Tokens** - 13+ months
✅ **Client Authentication** - Basic auth or POST body
✅ **Redirect URI Validation** - Prevents open redirects

## Data Provided to Aggregators

When users link their BullionTracker account, aggregators receive:

### Account Information
- Account type: Other Investment
- Account nickname: "Bullion Collection"
- Current value: Total spot value of all metals
- Currency: USD

### Holdings
For each metal type (Gold, Silver, Platinum):
- Symbol: XAU, XAG, XPT
- Units: Total troy ounces
- Current price per oz
- Market value
- Metadata: metal type, weight

### Transactions
- Purchase date
- Description
- Amount paid
- Units (oz) purchased
- Price per oz

## Troubleshooting

### "Invalid client_id"
- Verify OAuth client exists in database
- Run `npx tsx scripts/seed-oauth-client.ts`

### "Invalid redirect_uri"
- Check that redirect URI is in client's `redirectUris` array
- Plaid uses: `https://cdn.plaid.com/link/v2/stable/oauth.html`

### "Invalid token"
- Check that OAUTH_PRIVATE_KEY and OAUTH_PUBLIC_KEY match
- Verify key ID in JWT header matches JWKS

### "User not found"
- Ensure user is logged in before OAuth flow
- Check that session is valid

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| ✅ OAuth Implementation | Complete | OIDC + token endpoints |
| ✅ FDX API Implementation | Complete | Account/transaction endpoints |
| ⏳ Testing | 1 week | Manual testing, edge cases |
| ⏳ Plaid Application | 2-4 weeks | Plaid's review process |
| 🎯 Go Live | TBD | Listed in Monarch/Copilot |

## Next Steps

1. ✅ Implementation complete
2. ⏳ Test OAuth flow end-to-end
3. ⏳ Apply to Plaid Core Exchange program
4. ⏳ Complete Plaid's technical validation
5. 🎯 Launch in aggregator apps!

## Support

For questions about this integration:
- OAuth/OIDC: https://openid.net/specs/openid-connect-core-1_0.html
- FDX API: https://financialdataexchange.org/FDX/About/FDX_API.aspx
- Plaid Core Exchange: https://plaid.com/products/core-exchange/
