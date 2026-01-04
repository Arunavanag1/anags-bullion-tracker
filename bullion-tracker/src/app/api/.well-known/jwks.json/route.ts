/**
 * JWKS (JSON Web Key Set) Endpoint
 * Returns public keys for JWT verification
 */

import { NextResponse } from 'next/server';
import { getJWKS } from '@/lib/plaid/jwks';

export async function GET() {
  try {
    const jwks = await getJWKS();
    return NextResponse.json(jwks);
  } catch (error) {
    console.error('JWKS error:', error);
    return NextResponse.json(
      { error: 'Failed to get JWKS' },
      { status: 500 }
    );
  }
}
