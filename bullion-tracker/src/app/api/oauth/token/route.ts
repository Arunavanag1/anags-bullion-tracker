/**
 * OAuth Token Endpoint
 * Exchanges authorization codes for tokens, handles refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  createAccessToken,
  createIdToken,
  createRefreshToken,
  verifyCodeChallenge,
} from '@/lib/plaid/oauth-tokens';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const grant_type = formData.get('grant_type') as string;

    // Handle authorization code exchange
    if (grant_type === 'authorization_code') {
      return await handleAuthorizationCodeGrant(formData, request);
    }

    // Handle refresh token exchange
    if (grant_type === 'refresh_token') {
      return await handleRefreshTokenGrant(formData);
    }

    return NextResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Token endpoint error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: String(error) },
      { status: 500 }
    );
  }
}

async function handleAuthorizationCodeGrant(
  formData: FormData,
  request: NextRequest
) {
  const code = formData.get('code') as string;
  const redirect_uri = formData.get('redirect_uri') as string;
  const code_verifier = formData.get('code_verifier') as string;

  // Get client credentials from Authorization header or form
  const { clientId, clientSecret } = await getClientCredentials(formData, request);

  if (!code || !redirect_uri || !clientId) {
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400 }
    );
  }

  // Verify client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client || client.clientSecret !== clientSecret) {
    return NextResponse.json(
      { error: 'invalid_client' },
      { status: 401 }
    );
  }

  // Find and validate authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code not found' },
      { status: 400 }
    );
  }

  if (authCode.used) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code already used' },
      { status: 400 }
    );
  }

  if (authCode.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code expired' },
      { status: 400 }
    );
  }

  if (authCode.clientId !== clientId) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Client ID mismatch' },
      { status: 400 }
    );
  }

  if (authCode.redirectUri !== redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    );
  }

  // Verify PKCE if present
  if (authCode.codeChallenge && authCode.codeChallengeMethod === 'S256') {
    if (!code_verifier) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Code verifier required' },
        { status: 400 }
      );
    }

    if (!verifyCodeChallenge(code_verifier, authCode.codeChallenge)) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid code verifier' },
        { status: 400 }
      );
    }
  }

  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { code },
    data: { used: true },
  });

  // Get user info for ID token
  const user = await prisma.user.findUnique({
    where: { id: authCode.userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'User not found' },
      { status: 400 }
    );
  }

  // Generate tokens
  const accessToken = await createAccessToken(
    authCode.userId,
    clientId,
    authCode.scope,
    3600 // 1 hour
  );

  const idToken = await createIdToken(
    authCode.userId,
    clientId,
    user.email || undefined,
    user.name || undefined
  );

  const refreshTokenValue = createRefreshToken();

  // Store refresh token
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setMonth(refreshTokenExpiry.getMonth() + 13); // 13 months

  await prisma.oAuthRefreshToken.create({
    data: {
      token: refreshTokenValue,
      clientId,
      userId: authCode.userId,
      scope: authCode.scope,
      expiresAt: refreshTokenExpiry,
    },
  });

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshTokenValue,
    id_token: idToken,
    scope: authCode.scope,
  });
}

async function handleRefreshTokenGrant(formData: FormData) {
  const refresh_token = formData.get('refresh_token') as string;

  if (!refresh_token) {
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400 }
    );
  }

  // Find refresh token
  const storedToken = await prisma.oAuthRefreshToken.findUnique({
    where: { token: refresh_token },
  });

  if (!storedToken) {
    return NextResponse.json(
      { error: 'invalid_grant' },
      { status: 400 }
    );
  }

  if (storedToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Refresh token expired' },
      { status: 400 }
    );
  }

  // Generate new access token
  const accessToken = await createAccessToken(
    storedToken.userId,
    storedToken.clientId,
    storedToken.scope,
    3600
  );

  // Rotate refresh token
  const newRefreshToken = createRefreshToken();
  const newExpiry = new Date();
  newExpiry.setMonth(newExpiry.getMonth() + 13);

  // Delete old refresh token and create new one
  await prisma.$transaction([
    prisma.oAuthRefreshToken.delete({
      where: { token: refresh_token },
    }),
    prisma.oAuthRefreshToken.create({
      data: {
        token: newRefreshToken,
        clientId: storedToken.clientId,
        userId: storedToken.userId,
        scope: storedToken.scope,
        expiresAt: newExpiry,
      },
    }),
  ]);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: newRefreshToken,
    scope: storedToken.scope,
  });
}

async function getClientCredentials(formData: FormData, request: NextRequest) {
  // Try Authorization header first (Basic auth)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [clientId, clientSecret] = credentials.split(':');
    return { clientId, clientSecret };
  }

  // Try form data
  const clientId = formData.get('client_id') as string;
  const clientSecret = formData.get('client_secret') as string;

  return { clientId, clientSecret };
}
