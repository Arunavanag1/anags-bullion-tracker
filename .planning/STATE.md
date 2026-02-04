# Project State

## Current Position

Phase: No active milestone
Plan: Not started
Status: v2.6 milestone shipped — planning next milestone
Last activity: 2026-02-04 - v2.6 milestone archived

Progress: Ready for next milestone

## Shipped Milestones

- **v2.6 Mobile Form UX** (2026-02-04) - Keyboard management, form spacing, section dividers, human-verified
- **v2.5 Numismatic Metal Content** (2026-01-24) - Metal content data model, US coinage rules, cert autofill, manual input, portfolio aggregation
- **v2.4 Security & Stability** (2026-01-23) - Auth audit, data security, account deletion, mobile hardening
- **v2.3 App Store Legal** (2026-01-19) - Privacy policy, contact page, Vercel deployment
- **v2.2 Cert Number Autofill** (2026-01-18) - PCGS/NGC cert lookup, form autofill, mobile scanner
- **v2.1 Coin Database Expansion** (2026-01-18) - PCGS API, search, validation
- **v2.0 Mobile Charts** (2026-01-18) - Victory Native charts with interactions, dashboard integration
- **v1.9 Deployment Ready** (2026-01-17) - Testing, security, performance, deployment config
- See `.planning/milestones/` for full archives

## Session Continuity

Last session: 2026-02-04
Stopped at: v2.6 milestone complete
Resume file: None

## Accumulated Context

### Key Decisions (v2.5)
- 5 phases for numismatic metal content tracking
- Automatic detection for US historical coinage (pre-1965 silver, pre-1933 gold)
- Integration with existing cert lookup for autofill
- Manual fallback for raw/ungraded coins
- Float (0.0-1.0) for purity rather than percentage (Phase 58)
- Nullable metal content fields for backward compatibility (Phase 58)
- Separate utility file for metal calculations (Phase 58)
- Check gold rules first for denominations containing $, dollar, eagle, gold (Phase 59)
- CoinReference data takes precedence over rules engine for flexibility (Phase 59)
- preciousMetalWeight object pattern on mobile for consistency with totalWeight (Phase 62)
- Conditional card display when metal content exists (Phase 62)
- Use US Mint official specs for preciousMetalOz values (Phase 59)

### Key Decisions (v2.4)
- 4 phases focused on security audit and hardening
- Authentication, data security, account deletion, mobile auth
- Reduced token refresh grace period from 7 days to 1 day (Phase 54)
- Enabled HSTS header for production security (Phase 54)
- Made OAuth keys fail-hard in production (Phase 54)
- FDX exact-match authorization (Phase 55)
- User existence verification for JWT tokens (Phase 55)
- Runtime fail-hard for rate limiting (Phase 55)
- Mocked Prisma tests for auth endpoints (Phase 56)
- Documented 8 cascade delete relationships (Phase 56)
- Accepted Cloudinary orphan limitation with future enhancement path (Phase 56)
- SecureStore audit passed - WHEN_UNLOCKED default is secure (Phase 57)
- Biometric auth deferred - low risk for collection tracker (Phase 57)
- Certificate pinning not implemented - HTTPS + HSTS sufficient (Phase 57)

### Key Decisions (v2.3)
- Standard privacy policy template for collection tracking app (Phase 52)
- Footer links on web and mobile for App Store compliance (Phase 52)
- Mobile links use Linking API to open web URLs (Phase 52)
- Email-only contact method for support (Phase 53)
- Documented response times and business hours (Phase 53)

### Key Decisions (v2.2)
- TypeScript over Python for PCGS API client (Phase 49)
- 800ms debounce for cert lookup (Phase 49, 50)
- Mutation over Query for cert lookup - on-demand (Phase 50)
- Multi-format barcode support for PCGS/NGC labels (Phase 51)
- Full-screen modal for scanner UX (Phase 51)

### Known Issues
- next-auth 5 beta may have breaking changes
- No email verification
- No password reset flow

### Key Decisions (v2.6)
- Standard KeyboardAvoidingView over third-party keyboard library (Phase 63)
- InputAccessoryView for iOS toolbar; Android uses native returnKeyType (Phase 63)
- Complex form components excluded from keyboard ref chain (Phase 63)
- 16px marginBottom as Input default, overridable via containerStyle (Phase 64)
- Migrated Input inline styles to StyleSheet.create (Phase 64)
- Consistent section header style across forms: fontSize 11, fontWeight 700, #9CA3AF (Phase 64)

## Blockers/Concerns

None currently.

## Roadmap Evolution

- v1.0-v1.8: Core feature development (Phases 1-30)
- v1.9: Deployment readiness (Phases 31-36) - **SHIPPED 2026-01-17**
- v2.0: Mobile Charts (Phases 37-42) - **SHIPPED 2026-01-18**
- v2.1: Coin Database Expansion (Phases 43-48) - **SHIPPED 2026-01-18**
- v2.2: Cert Number Autofill (Phases 49-51) - **SHIPPED 2026-01-18**
- v2.3: App Store Legal (Phases 52-53) - **SHIPPED 2026-01-19**
- v2.4: Security & Stability (Phases 54-57) - **SHIPPED 2026-01-23**
- v2.5: Numismatic Metal Content (Phases 58-62) - **SHIPPED 2026-01-24**
- v2.6: Mobile Form UX (Phases 63-65) - **SHIPPED 2026-02-04**
