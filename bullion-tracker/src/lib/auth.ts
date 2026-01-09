import { auth } from '@/auth';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// Fail hard if JWT secret is not configured - never use a fallback
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

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
      return decoded.userId;
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw new Error('Unauthorized');
    }
  }

  throw new Error('Unauthorized');
}
