import { auth } from '@/auth';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

// Fail hard if JWT secret is not configured - never use a fallback
function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
  }
  return secret;
}
const JWT_SECRET = getJwtSecret();

interface JWTPayload {
  userId: string;
  email: string;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

export async function getUserId(): Promise<string> {
  // First try to get from NextAuth session (web)
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id as string;
  }

  // Then try JWT token from Authorization header (mobile)
  const headersList = await headers();
  const authorization = headersList.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Verify user still exists in database (prevents deleted users from accessing API)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true }
      });
      if (!user) {
        throw new Error('Unauthorized - User not found');
      }

      return decoded.userId;
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw new Error('Unauthorized');
    }
  }

  throw new Error('Unauthorized');
}
