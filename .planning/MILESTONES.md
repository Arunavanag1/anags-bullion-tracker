# Project Milestones: Bullion Collection Tracker

## v2.6 Mobile Form UX (Shipped: 2026-02-04)

**Delivered:** Improved mobile add coin/bullion form experience with keyboard management, field spacing, and section dividers.

**Phases completed:** 63-65 (3 plans total)

**Key accomplishments:**
- KeyboardAvoidingView with tap-to-dismiss and interactive scroll dismiss
- iOS FormToolbar with Previous/Next/Done buttons via InputAccessoryView
- Sequential field navigation with ref chains for both BullionForm and NumismaticForm
- Default 16px Input spacing with StyleSheet.create migration
- Section dividers and headers for BullionForm (3 sections) and NumismaticForm (4 sections)
- Human-verified on iOS simulator — approved with no fixes needed

**Stats:**
- 5 code files modified
- +438 / -90 lines of TypeScript
- 3 phases, 3 plans, 7 tasks
- 2 days (2026-02-03 → 2026-02-04)

**Git range:** `feat(63-01)` → `docs(65-01)`

**What's next:** TBD — next milestone planning

---

## v2.2 Cert Number Autofill (Shipped: 2026-01-18)

**Delivered:** PCGS/NGC cert number autofill on web and mobile with camera-based barcode scanning.

**Phases completed:** 49-51 (3 plans total)

**Key accomplishments:**
- TypeScript PCGS API client with OAuth2 auth, token caching, retry logic
- Cert lookup endpoint with PCGS integration and NGC fallback
- Mobile autofill with debounced lookup, auto-populates grade/metal/price
- Web autofill using `useCertLookup` hook with TanStack Query
- Barcode scanner with expo-camera for PCGS ITF + NGC QR parsing
- Auto service detection from barcode format

**Stats:**
- 17 files created/modified
- +2,023 / -106 lines of TypeScript
- 3 phases, 3 plans
- 1 day (2026-01-18)

**Git range:** `feat(49-01)` → `docs(51-01)`

**What's next:** v2.0 Mobile Charts completion (Phase 42 Dashboard Integration)

---

## v1.9 Deployment Ready (Shipped: 2026-01-17)

**Delivered:** Production-ready codebase with comprehensive testing, security hardening, performance optimization, and deployment configuration.

**Phases completed:** 31-36 (12 plans total)

**Key accomplishments:**
- 76 tests covering calculations, validation, and auth flows
- JWT security hardening with 7-day expiry and refresh rotation
- Security headers, API error standardization, rate limiting
- N+1 query fixes, cursor-based pagination, bundle optimization
- TypeScript strict types, dead code removal
- Health check endpoint, Sentry monitoring, Vercel config, deployment runbook

**Stats:**
- 51 files created/modified
- +3,937 / -472 lines of TypeScript
- 6 phases, 12 plans
- 2 days (2026-01-16 → 2026-01-17)

**Git range:** `feat(31-01)` → `docs(36-02)`

**What's next:** v2.0 Mobile Charts - Interactive charts on mobile dashboard

---

*See `.planning/milestones/` for archived milestone details*
