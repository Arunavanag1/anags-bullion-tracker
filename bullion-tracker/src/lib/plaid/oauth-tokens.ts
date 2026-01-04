/**
 * OAuth Token Management
 * Creates and verifies JWT access tokens and refresh tokens
 */

import { SignJWT, jwtVerify } from 'jose';
import { getPrivateKey, getPublicKey, getKeyId } from './jwks';
import { randomBytes } from 'crypto';

const ISSUER = process.env.NEXT_PUBLIC_API_URL || 'https://api.bulliontracker.app';
const AUDIENCE = `${ISSUER}/fdx`;

export interface AccessTokenPayload {
  sub: string; // User ID
  scope: string;
  client_id: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenData {
  userId: string;
  clientId: string;
  scope: string;
  createdAt: number;
}

/**
 * Generate an access token (JWT format required by Plaid)
 */
export async function createAccessToken(
  userId: string,
  clientId: string,
  scope: string,
  expiresInSeconds: number = 3600 // 1 hour
): Promise<string> {
  const privateKey = await getPrivateKey();

  const token = await new SignJWT({
    sub: userId,
    scope,
    client_id: clientId,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: getKeyId() })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(privateKey as any);

  return token;
}

/**
 * Generate an ID token (OIDC)
 */
export async function createIdToken(
  userId: string,
  clientId: string,
  email?: string,
  name?: string
): Promise<string> {
  const privateKey = await getPrivateKey();

  const payload: Record<string, any> = {
    sub: userId,
  };

  if (email) payload.email = email;
  if (name) payload.name = name;

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: getKeyId() })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(clientId)
    .setExpirationTime('15m')
    .sign(privateKey as any);

  return token;
}

/**
 * Generate a refresh token (opaque, long-lived)
 * Store in database with associated user ID and client ID
 */
export function createRefreshToken(): string {
  // Generate a secure random token
  return randomBytes(32).toString('base64url');
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const publicKey = await getPublicKey();

  const { payload } = await jwtVerify(token, publicKey as any, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  return payload as unknown as AccessTokenPayload;
}

/**
 * Generate an authorization code (short-lived, one-time use)
 */
export function createAuthorizationCode(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate a PKCE code challenge from verifier
 */
export function generateCodeChallenge(codeVerifier: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
}

/**
 * Verify PKCE code challenge
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  const computed = generateCodeChallenge(codeVerifier);
  return computed === codeChallenge;
}
