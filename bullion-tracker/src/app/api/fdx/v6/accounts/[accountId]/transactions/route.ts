/**
 * FDX API - Get Account Transactions
 * Returns transaction history for the account
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/plaid/oauth-tokens';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

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

    // Verify account belongs to user
    if (!accountId.endsWith(userId)) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Parse dates
    const startDate = startTime ? new Date(startTime) : new Date(0);
    const endDate = endTime ? new Date(endTime) : new Date();

    // Get user's collection items as "purchases"
    const items = await prisma.collectionItem.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Build transactions
    const transactions = items.map((item) => {
      const weightOz = item.weightOz || 0;
      const spotPrice = item.spotPriceAtCreation || 0;
      const bookValue = item.customBookValue || (weightOz * spotPrice);

      return {
        investmentTransaction: {
          transactionId: item.id,
          transactionType: 'PURCHASED',
          postedTimestamp: item.createdAt.toISOString(),
          description: item.title || `Purchased ${weightOz} oz ${item.metal}`,
          amount: bookValue,
          units: weightOz,
          unitPrice: spotPrice,
          securityType: 'OTHER',
        },
      };
    });

    return NextResponse.json({
      transactions,
      page: {
        nextOffset: items.length === limit ? (offset + limit).toString() : null,
      },
    });
  } catch (error) {
    console.error('FDX transactions error:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
