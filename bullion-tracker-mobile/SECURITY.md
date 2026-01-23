# Mobile Security Architecture

This document describes the security architecture and decisions for the Bullion Collection Tracker mobile app.

## Authentication

### Token Storage

The app uses `expo-secure-store` for JWT token storage, providing:

- **iOS**: Keychain Services (hardware-backed encryption)
- **Android**: Keystore + SharedPreferences (encrypted at rest)

Configuration:
- **Keychain Accessibility**: WHEN_UNLOCKED (default)
  - Tokens accessible only when device is unlocked
  - Protected by device passcode/biometric
- **Token Keys**: `auth_token` (JWT), `auth_user` (user data)

Lifecycle:
- Stored on successful sign-in
- Cleared on sign-out
- Cleared on account deletion (via signOut() call)

### Biometric Authentication

**Status: Deferred**

**Rationale:**
- This is a personal collection tracker, not a financial app
- No payment processing or funds transfer
- Users already authenticate with password
- Biometric adds complexity without proportional security benefit
- Target users are collectors viewing their own inventory

**Future consideration:**
If users request it, biometric can be added with `expo-local-authentication`:
- Require biometric before showing collection
- Store biometric preference in AsyncStorage (non-sensitive setting)
- Fall back to password if biometric fails
- Would require app lock screen implementation

### Certificate Pinning

**Status: Not Implemented**

**Rationale:**
- API uses HTTPS with valid certificate from Vercel
- Certificate pinning adds significant complexity:
  - Pin rotation requires app updates
  - Build-time configuration needed
  - Risk of app breaking if certificate changes
- Proportional security benefit is low for collection tracker
- Man-in-the-middle attacks are mitigated by HTTPS + HSTS headers

**If needed in future:**
- Use `expo-network` with custom native module
- Or `react-native-ssl-pinning` library
- Would likely require ejecting from Expo managed workflow
- Implement graceful degradation for pin failures

## Data Security

### Local Storage

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| JWT Token | SecureStore | Sensitive credential |
| User Data | SecureStore | Contains user ID/email |
| Coins Cache | AsyncStorage | Public reference data |
| Price Cache | AsyncStorage | Cached API responses |
| Grades List | AsyncStorage | Static reference data |

### Network Security

- All API calls use HTTPS
- JWT tokens sent in Authorization header
- 30-second timeout on requests (handles serverless cold starts)
- No sensitive data logged in error messages

## Security Audit Completed

The following security phases were completed for v2.4 Security & Stability:

- **Phase 54**: Auth security audit
  - JWT token expiry (7-day refresh, 1-day grace)
  - HSTS header enabled for production
  - OAuth keys fail-hard in production

- **Phase 55**: Data security review
  - FDX exact-match authorization
  - User existence verification for JWT tokens
  - Rate limiting fail-hard in production

- **Phase 56**: Account deletion security
  - Cascade delete tests for all relationships
  - 8 delete relationships documented
  - Cloudinary orphan limitation documented

- **Phase 57**: Mobile auth hardening
  - SecureStore usage audited (this document)
  - Security architecture decisions documented

## Version History

- **2026-01-23**: Initial security architecture document (Phase 57)
