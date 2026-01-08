# Technology Stack

**Analysis Date:** 2026-01-09

## Languages

**Primary:**
- TypeScript 5.x - All application code (strict mode enabled in both projects)

**Secondary:**
- JavaScript - Build scripts, config files
- JSX/TSX - React components

## Runtime

**Environment:**
- Node.js (web) - No explicit version specified, uses compatible dependencies
- React Native with Expo ~54.0.30 (mobile) - `bullion-tracker-mobile/package.json`
- Platform: macOS (development), cross-platform deployment

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present in both projects
  - Web: `bullion-tracker/package-lock.json`
  - Mobile: `bullion-tracker-mobile/package-lock.json`

## Frameworks

**Core:**
- Next.js 16.1.1 (web) - `bullion-tracker/package.json`
- React 19.2.3 (web) - `bullion-tracker/package.json`
- React Native 0.81.5 (mobile) - `bullion-tracker-mobile/package.json`
- React 19.1.0 (mobile) - `bullion-tracker-mobile/package.json`
- Expo ~54.0.30 (mobile) - `bullion-tracker-mobile/package.json`

**Testing:**
- Not currently configured - No test framework installed

**Build/Dev:**
- TypeScript 5.x - Compilation
- Tailwind CSS 4 (web) - `bullion-tracker/package.json`
- Tailwind CSS 3.4.19 (mobile) - `bullion-tracker-mobile/package.json`
- NativeWind 4.2.1 (Tailwind for React Native) - `bullion-tracker-mobile/package.json`
- ESLint 9 - `bullion-tracker/eslint.config.mjs`

## Key Dependencies

**Critical:**
- Prisma 7.2.0 + @prisma/client 7.2.0 - Database ORM - `bullion-tracker/package.json`
- next-auth 5.0.0-beta.30 - Authentication - `bullion-tracker/package.json`
- @tanstack/react-query 5.90.14 - Data fetching - `bullion-tracker/package.json`
- axios 1.13.2 - HTTP client (mobile) - `bullion-tracker-mobile/package.json`

**Infrastructure:**
- pg 8.16.3 - PostgreSQL client - `bullion-tracker/package.json`
- expo-sqlite 16.0.10 - Local SQLite (mobile) - `bullion-tracker-mobile/package.json`
- expo-secure-store ~15.0.8 - Secure token storage (mobile) - `bullion-tracker-mobile/package.json`

**UI:**
- framer-motion 12.23.26 - Animations - `bullion-tracker/package.json`
- recharts 3.6.0 - Charts (web) - `bullion-tracker/package.json`
- victory-native 41.20.2 - Charts (mobile) - `bullion-tracker-mobile/package.json`
- @dnd-kit/core 6.3.1 - Drag and drop - `bullion-tracker/package.json`

**Data Processing:**
- cheerio 1.1.2 - Web scraping (PCGS prices) - `bullion-tracker/package.json`
- browser-image-compression 2.0.2 - Image compression - `bullion-tracker/package.json`
- heic2any 0.0.4 - HEIC to JPEG conversion - `bullion-tracker/package.json`

## Configuration

**Environment:**
- `.env` files - Web: `bullion-tracker/.env`, Mobile: `bullion-tracker-mobile/.env`
- `.env.example` templates in both projects
- Key configs: DATABASE_URL, NEXTAUTH_SECRET, METAL_PRICE_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

**Build:**
- `bullion-tracker/next.config.ts` - Next.js configuration (minimal)
- `bullion-tracker/tsconfig.json` - TypeScript config with `@/*` path alias
- `bullion-tracker-mobile/tsconfig.json` - Extends expo/tsconfig.base
- `bullion-tracker/eslint.config.mjs` - ESLint with Next.js config
- `bullion-tracker-mobile/tailwind.config.js` - Custom metal-themed colors

## Platform Requirements

**Development:**
- Any platform with Node.js
- PostgreSQL for database
- Expo CLI for mobile development

**Production:**
- Web: Vercel or any Node.js hosting
- Mobile: iOS/Android via Expo
- PostgreSQL database (Prisma compatible)

---

*Stack analysis: 2026-01-09*
*Update after major dependency changes*
