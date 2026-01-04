/**
 * OAuth UserInfo Endpoint
 * Returns user information for authenticated requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/plaid/oauth-tokens';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = await verifyAccessToken(token);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('UserInfo error:', error);
    return NextResponse.json(
      { error: 'invalid_token' },
      { status: 401 }
    );
  }
}
