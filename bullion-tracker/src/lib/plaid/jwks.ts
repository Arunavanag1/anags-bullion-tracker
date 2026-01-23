/**
 * JWKS (JSON Web Key Set) Management for OAuth
 * Generates and manages RSA key pairs for JWT signing
 */

import { generateKeyPair, exportJWK, exportPKCS8, CryptoKey, KeyObject } from 'jose';
import * as crypto from 'crypto';

export interface JWKSKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export interface JWKSResponse {
  keys: JWKSKey[];
}

// In production, store this in environment variable or secrets manager
const PRIVATE_KEY_PEM = process.env.OAUTH_PRIVATE_KEY;
const PUBLIC_KEY_PEM = process.env.OAUTH_PUBLIC_KEY;
const KEY_ID = process.env.OAUTH_KEY_ID || 'bulliontracker-key-2025';

let cachedPrivateKey: crypto.KeyObject | null = null;
let cachedPublicKey: crypto.KeyObject | null = null;
let cachedJWKS: JWKSResponse | null = null;

/**
 * Generate a new RSA key pair for development/testing
 * In production, keys should be generated once and stored securely
 */
export async function generateKeyPairForDevelopment() {
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
  });

  const privatePEM = await exportPKCS8(privateKey);
  const publicJWK = await exportJWK(publicKey);

  console.log('=== Generated OAuth Key Pair ===');
  console.log('Add these to your .env file:');
  console.log('\nOAUTH_PRIVATE_KEY=');
  console.log(privatePEM);
  console.log('\nOAUTH_PUBLIC_KEY (JWK):');
  console.log(JSON.stringify(publicJWK, null, 2));
  console.log('\nOAUTH_KEY_ID=bulliontracker-key-2025');

  return { publicKey, privateKey, publicJWK };
}

/**
 * Check if running in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

/**
 * Get or create RSA key pair
 * In production, keys MUST be provided via environment variables
 * In development, temporary keys may be generated (with warning)
 */
async function getKeyPair() {
  if (cachedPrivateKey && cachedPublicKey) {
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  if (PRIVATE_KEY_PEM && PUBLIC_KEY_PEM) {
    // Load from environment
    cachedPrivateKey = crypto.createPrivateKey(PRIVATE_KEY_PEM);
    cachedPublicKey = crypto.createPublicKey(PUBLIC_KEY_PEM);
  } else if (isProduction()) {
    // FAIL HARD in production - do not allow temporary keys
    throw new Error(
      'OAUTH_PRIVATE_KEY and OAUTH_PUBLIC_KEY environment variables are required in production. ' +
      'Run generateKeyPairForDevelopment() to create keys, then add them to your environment.'
    );
  } else {
    // Generate new keys for development ONLY
    console.warn(
      '⚠️ OAUTH_PRIVATE_KEY not found. Generating temporary keys for DEVELOPMENT ONLY. ' +
      'These keys will not persist across restarts.'
    );
    const { privateKey, publicKey } = await generateKeyPair('RS256', {
      modulusLength: 2048,
    });
    cachedPrivateKey = privateKey as unknown as crypto.KeyObject;
    cachedPublicKey = publicKey as unknown as crypto.KeyObject;
  }

  return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
}

/**
 * Get private key for signing JWTs
 */
export async function getPrivateKey(): Promise<crypto.KeyObject> {
  const { privateKey } = await getKeyPair();
  return privateKey;
}

/**
 * Get public key for verification
 */
export async function getPublicKey(): Promise<crypto.KeyObject> {
  const { publicKey } = await getKeyPair();
  return publicKey;
}

/**
 * Export public key as JWK for JWKS endpoint
 */
export async function getJWKS(): Promise<JWKSResponse> {
  if (cachedJWKS) {
    return cachedJWKS;
  }

  const { publicKey } = await getKeyPair();

  // Export as JWK
  const jwk = await exportJWK(publicKey as unknown as CryptoKey | KeyObject);

  cachedJWKS = {
    keys: [
      {
        kty: jwk.kty!,
        kid: KEY_ID,
        use: 'sig',
        alg: 'RS256',
        n: jwk.n!,
        e: jwk.e!,
      },
    ],
  };

  return cachedJWKS;
}

/**
 * Get the Key ID for signing tokens
 */
export function getKeyId(): string {
  return KEY_ID;
}
