import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import bcrypt from 'bcryptjs';

const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

export async function POST(request: NextRequest) {
  try {
    // Rate limit check (prevent abuse)
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

    // Get authenticated user
    let userId: string;
    try {
      userId = await getUserId();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, confirmationText } = body;

    // Validate confirmation text
    if (confirmationText !== CONFIRMATION_TEXT) {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has a password (credential account), verify it
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for account deletion' },
          { status: 400 }
        );
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 401 }
        );
      }
    }

    // Delete user and all related data in a transaction
    // Most relations have onDelete: Cascade, but we explicitly clean up OAuth tokens
    // to ensure no orphaned records remain
    await prisma.$transaction(async (tx) => {
      // Explicitly delete OAuth tokens (they now have cascade, but be thorough)
      await tx.oAuthAuthorizationCode.deleteMany({
        where: { userId },
      });

      await tx.oAuthRefreshToken.deleteMany({
        where: { userId },
      });

      // Delete the user (cascades to items, snapshots, accounts, sessions)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}
