# TrakStack - Deployment Guide

Complete guide for deploying TrakStack to production.

## Prerequisites

Before deploying, ensure you have:

- **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
- **PostgreSQL Database** - Recommended providers:
  - [Supabase](https://supabase.com) (free tier available)
  - [Neon](https://neon.tech) (free tier available)
  - [Railway](https://railway.app) (usage-based pricing)

### Optional Services

| Service | Purpose | Required? |
|---------|---------|-----------|
| Upstash Redis | Persistent rate limiting | Recommended |
| Cloudinary | Image storage (CDN) | Recommended |
| Sentry | Error monitoring | Optional |
| Google OAuth | Social login | Optional |

## Environment Variables

| Variable | Required | Description | How to Get |
|----------|----------|-------------|------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | From your DB provider dashboard |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Your app URL | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_METAL_PRICE_API_KEY` | Yes (prod) | Spot price API key | [metalpriceapi.com](https://metalpriceapi.com) |
| `UPSTASH_REDIS_REST_URL` | No | Redis REST URL | [console.upstash.com](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Redis REST token | Upstash dashboard |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name | [cloudinary.com/console](https://cloudinary.com/console) |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No | Unsigned upload preset | Cloudinary Settings > Upload |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN | [sentry.io](https://sentry.io) project settings |
| `SENTRY_DSN` | No | Server-side Sentry DSN | Same as above |
| `SENTRY_ORG` | No | Sentry org slug | Sentry project URL |
| `SENTRY_PROJECT` | No | Sentry project slug | Sentry project URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | [console.cloud.google.com](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret | Google Cloud Console |

## First Deployment Steps

### 1. Fork/Clone Repository

```bash
git clone https://github.com/your-username/bullion-tracker.git
cd bullion-tracker
```

### 2. Create Database

Using Supabase:
1. Create new project at [supabase.com](https://supabase.com)
2. Go to Settings > Database > Connection string
3. Copy the URI (with `?sslmode=require`)

Using Neon:
1. Create new project at [neon.tech](https://neon.tech)
2. Copy the connection string from dashboard

### 3. Create Vercel Project

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Create project and link
vercel link
```

Or via Vercel Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Select "Next.js" as framework

### 4. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings > Environment Variables
2. Add each variable from the table above
3. Select appropriate environments (Production, Preview, Development)

Or via CLI:
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
# ... repeat for each variable
```

### 5. Deploy

```bash
# Deploy to production
vercel --prod
```

Or push to your connected Git repository - Vercel auto-deploys on push.

### 6. Run Database Migrations

After first deployment:
```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

### 7. Verify Deployment

Check the health endpoint:
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-17T...",
  "version": "0.1.0",
  "checks": {
    "database": { "status": "ok", "latencyMs": 5 },
    "redis": { "status": "not_configured" },
    "spotPrices": { "status": "ok" }
  }
}
```

## Post-Deployment Verification

### Health Check
- [ ] `/api/health` returns `status: "healthy"` or `"degraded"`
- [ ] Database check shows `status: "ok"`

### Authentication
- [ ] Can register new account at `/auth/signup`
- [ ] Can sign in at `/auth/signin`
- [ ] Protected pages redirect unauthenticated users

### Image Uploads (if Cloudinary configured)
- [ ] Can add new collection item with image
- [ ] Image displays correctly after upload
- [ ] Image URL starts with `res.cloudinary.com`

### Error Monitoring (if Sentry configured)
- [ ] Trigger test error in browser console
- [ ] Verify error appears in Sentry dashboard

### Spot Prices
- [ ] `/api/prices` returns current gold/silver/platinum prices
- [ ] Dashboard shows live spot prices

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check SSL mode: URL should include `?sslmode=require`

#### "Not authenticated" errors
- Verify `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- Verify `NEXTAUTH_URL` matches your deployment URL exactly

#### Images not loading
- Check Cloudinary credentials are correct
- Verify upload preset exists and is "unsigned"
- Check browser console for CORS errors

#### Rate limiting not working
- Configure Upstash Redis for persistent rate limiting
- Without Redis, rate limits reset on each deployment

#### Build failures
- Run `npm run build` locally to identify issues
- Check Vercel deployment logs for specific errors

### Checking Logs

```bash
# View deployment logs
vercel logs --follow

# View function logs
vercel logs --follow --scope=api
```

Or in Vercel Dashboard: Project > Deployments > [deployment] > Functions

### Health Check Interpretation

| Status | Meaning | Action |
|--------|---------|--------|
| `healthy` | All services operational | None |
| `degraded` | Non-critical service down | Check Redis/Cloudinary |
| `unhealthy` | Database unavailable | Check DATABASE_URL, connection |

## Security Checklist

Before going live, verify:

- [ ] `NEXTAUTH_SECRET` is unique and secure (not the default)
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] No secrets in client-side code (check with `NEXT_PUBLIC_` prefix)
- [ ] Rate limiting enabled (Upstash configured)
- [ ] Cloudinary configured (avoid database bloat from base64 images)
- [ ] Git repository doesn't contain `.env` files

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Monitoring

### Health Check Endpoint

Use `/api/health` for uptime monitoring:
- Pingdom, UptimeRobot, or similar services
- Set up alerts for `status: "unhealthy"` responses

### Sentry Dashboard

If configured:
- Monitor error rates
- Set up alerts for new issues
- Review performance metrics

### Vercel Analytics

Built into Vercel (enable in project settings):
- Page load performance
- Web vitals
- Traffic analytics

## Updating the Application

### Manual Deployment
```bash
git pull origin main
vercel --prod
```

### Auto-Deploy (recommended)
Connect your Git repository - Vercel deploys automatically on:
- Push to main branch (production)
- Pull requests (preview deployments)

### Database Migrations
After schema changes:
```bash
npx prisma migrate deploy
```

## Support

- **Issues**: [github.com/your-username/bullion-tracker/issues](https://github.com/your-username/bullion-tracker/issues)
- **Documentation**: See `.env.example` for detailed variable descriptions
