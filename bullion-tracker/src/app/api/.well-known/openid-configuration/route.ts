/**
 * OIDC Discovery Endpoint
 * Returns OAuth 2.0 and OpenID Connect metadata
 */

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET() {
  const config = {
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/api/oauth/authorize`,
    token_endpoint: `${BASE_URL}/api/oauth/token`,
    jwks_uri: `${BASE_URL}/api/.well-known/jwks.json`,
    userinfo_endpoint: `${BASE_URL}/api/oauth/userinfo`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
    ],
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'offline_access',
      'accounts:read',
    ],
    claims_supported: ['sub', 'name', 'email'],
    code_challenge_methods_supported: ['S256'],
  };

  return NextResponse.json(config);
}
