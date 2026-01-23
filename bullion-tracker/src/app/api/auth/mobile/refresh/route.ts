import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

// Fail hard if JWT secret is not configured - never use a fallback
function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
  }
  return secret;
}
const JWT_SECRET = getJwtSecret();

// Grace period: accept expired tokens up to 1 day old for refresh
// Reduced from 7 days to limit exposure window for stolen tokens
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check (same as signin: 5 per 60s)
    const clientIp = getClientIp(request);
    const { success, reset } = await checkRateLimit(clientIp);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset || Date.now() + 60000 - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Extract token from Authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);

    // Try to verify the token, allowing expired tokens within grace period
    let decoded: JWTPayload;
    try {
      // First try normal verification
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error: unknown) {
      // If token expired, check if within grace period
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        // Decode without verification to check expiry time
        const payload = jwt.decode(token) as JWTPayload | null;

        if (!payload || !payload.exp) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }

        const expiredAt = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const expiredAgo = now - expiredAt;

        // Check if within grace period
        if (expiredAgo > GRACE_PERIOD_MS) {
          return NextResponse.json(
            { error: 'Token expired beyond refresh window' },
            { status: 401 }
          );
        }

        // Token is expired but within grace period - accept it
        decoded = payload;
      } else {
        // Token is invalid for other reasons (tampered, malformed, etc.)
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    // Issue new token with fresh 7-day expiry
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token: newToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
