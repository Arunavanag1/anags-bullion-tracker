/**
 * FDX API - List Accounts
 * Returns all investment accounts for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/plaid/oauth-tokens';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify access token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    // Get portfolio summary
    const portfolio = await prisma.collectionItem.groupBy({
      by: ['userId'],
      where: { userId },
      _sum: {
        weightOz: true,
      },
    });

    // Return account list
    return NextResponse.json({
      accounts: [
        {
          investmentAccount: {
            accountId: `bullion_${userId}`,
            accountType: 'OTHERINVESTMENT',
            accountNumberDisplay: `****${userId.slice(-4)}`,
            productName: 'Precious Metals Portfolio',
            nickname: 'Bullion Collection',
            status: 'OPEN',
            currency: {
              currencyCode: 'USD',
            },
          },
        },
      ],
    });
  } catch (error) {
    console.error('FDX accounts error:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
