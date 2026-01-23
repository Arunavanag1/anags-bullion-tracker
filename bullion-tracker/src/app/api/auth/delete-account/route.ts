/**
 * Account Deletion API Endpoint
 *
 * Permanently deletes a user account and all associated data.
 *
 * ## Cascade Delete Behavior (defined in prisma/schema.prisma)
 *
 * When the User record is deleted, the following are automatically CASCADE deleted:
 * - Account (OAuth provider accounts like Google)
 * - Session (user sessions)
 * - CollectionItem (user's bullion/numismatic items)
 *   - Image (item images, cascade via CollectionItem)
 *   - ItemValueHistory (historical values, cascade via CollectionItem)
 * - PortfolioSnapshot (historical portfolio data)
 * - OAuthAuthorizationCode (FDX/Plaid auth codes)
 * - OAuthRefreshToken (FDX/Plaid refresh tokens)
 *
 * ## Explicit Deletes (Defensive Programming)
 * OAuth tokens are explicitly deleted in the transaction even though they have
 * cascade. This is defensive programming - if cascade behavior ever changes,
 * the explicit deletes ensure no orphaned tokens remain.
 *
 * ## Known Limitations
 * - Cloudinary images become orphans (publicId not stored in DB, only URL)
 *   This is acceptable: images contain no PII beyond what's visible,
 *   and orphaned images are a billing concern, not a security issue.
 *
 * @see prisma/schema.prisma for cascade relationship definitions
 * @see src/__tests__/api/auth/delete-account.test.ts for test coverage
 */

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
    // See file header comment for full cascade delete documentation
    await prisma.$transaction(async (tx) => {
      // DEFENSIVE: Explicitly delete OAuth tokens before user deletion.
      // These have onDelete: Cascade in the schema, but explicit deletion
      // ensures no orphaned tokens if cascade behavior ever changes.
      await tx.oAuthAuthorizationCode.deleteMany({
        where: { userId },
      });

      await tx.oAuthRefreshToken.deleteMany({
        where: { userId },
      });

      // Delete user - triggers CASCADE delete for all related records:
      // Account, Session, CollectionItem (->Image, ->ItemValueHistory),
      // PortfolioSnapshot, OAuthAuthorizationCode, OAuthRefreshToken
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
