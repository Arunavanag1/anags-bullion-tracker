/**
 * OAuth Authorization Endpoint
 * Handles the authorization code flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuthorizationCode } from '@/lib/plaid/oauth-tokens';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse OAuth parameters
  const response_type = searchParams.get('response_type');
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');
  const code_challenge = searchParams.get('code_challenge');
  const code_challenge_method = searchParams.get('code_challenge_method');

  // Validate required parameters
  if (!response_type || response_type !== 'code') {
    return new NextResponse('Invalid response_type', { status: 400 });
  }

  if (!client_id || !redirect_uri || !scope) {
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  // Verify client exists
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
  });

  if (!client) {
    return new NextResponse('Invalid client_id', { status: 400 });
  }

  // Verify redirect_uri is allowed
  if (!client.redirectUris.includes(redirect_uri)) {
    return new NextResponse('Invalid redirect_uri', { status: 400 });
  }

  // Check if user is logged in
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Generate authorization code
  const code = createAuthorizationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store authorization code
  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: client_id,
      userId,
      redirectUri: redirect_uri,
      scope: scope || '',
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      expiresAt,
    },
  });

  // Redirect back to client with authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(redirectUrl.toString());
}
