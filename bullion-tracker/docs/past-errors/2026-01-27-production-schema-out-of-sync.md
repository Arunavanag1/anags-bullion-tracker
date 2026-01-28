# Production Database Schema Out of Sync

**Date:** 2026-01-27
**Severity:** Critical (app completely broken)
**Time to resolve:** ~30 minutes

## Symptoms

- Mobile app showed `$0.00` portfolio value
- "Connection Error: Could not connect to server" alert on app load
- Console errors: "Failed to fetch collection items", "Failed to fetch portfolio history", "Failed to load performance data"
- Spot prices banner worked (public API), but all authenticated endpoints failed
- Same issue on both App Store production app AND web deployment

## Root Cause

The production Neon database schema was out of sync with the Prisma schema. New columns had been added to the `CollectionItem` model in `schema.prisma` but were never pushed to the production database.

**Error in Vercel logs:**
```
prisma:error
Invalid `prisma.collectionItem.findMany()` invocation:
The column `(not available)` does not exist in the current database.
```

## Why It Happened

1. Local development uses a different database (localhost PostgreSQL)
2. Production uses Neon cloud database (`ep-lucky-shadow-aenhm4gd.c-2.us-east-2.aws.neon.tech`)
3. Schema changes were applied locally but never pushed to production
4. Vercel deployments don't automatically run migrations

## The Fix

```bash
# Push schema to production Neon database
DATABASE_URL="postgresql://neondb_owner:<password>@ep-lucky-shadow-aenhm4gd.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" npx prisma db push
```

Then redeploy to Vercel:
```bash
vercel --prod
```

## Prevention

1. **Before deploying**, always check if schema changes need to be pushed:
   ```bash
   # Check migration status against production
   DATABASE_URL="<prod-url>" npx prisma migrate status
   ```

2. **Add to deployment checklist:**
   - [ ] Run `prisma db push` or `prisma migrate deploy` against production
   - [ ] Verify API health after deployment

3. **Consider CI/CD integration:**
   - Add a Vercel build step that runs `prisma migrate deploy`
   - Or use Prisma Migrate in production with proper migration files

## Related Files

- `prisma/schema.prisma` - Schema definition
- `.env.vercel` - Production environment variables (pulled via `vercel env pull`)
- `src/lib/db.ts` - Prisma client configuration

## Commands Used to Debug

```bash
# Check Vercel logs for errors
vercel logs bullion-tracker-plum.vercel.app

# Pull production env vars
vercel env pull .env.vercel --environment production

# Connect to production database directly
PGPASSWORD="<password>" psql -h "ep-lucky-shadow-aenhm4gd.c-2.us-east-2.aws.neon.tech" -U "neondb_owner" -d "neondb"

# Check health endpoint
curl -s "https://bullion-tracker-plum.vercel.app/api/health"
```
