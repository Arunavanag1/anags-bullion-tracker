import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/collection/[id]/history
 * Returns value history entries for an item
 *
 * Query params:
 *   - limit?: number - Max entries to return (default 30)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Verify item belongs to user
    const item = await prisma.collectionItem.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      );
    }

    // Fetch value history
    const history = await prisma.itemValueHistory.findMany({
      where: {
        collectionItemId: id,
      },
      orderBy: {
        priceDate: 'desc',
      },
      take: limit,
      select: {
        priceDate: true,
        value: true,
        source: true,
      },
    });

    // Format dates as ISO strings
    const formattedHistory = history.map(entry => ({
      priceDate: entry.priceDate.toISOString().split('T')[0],
      value: entry.value,
      source: entry.source,
    }));

    return NextResponse.json({
      success: true,
      data: formattedHistory,
    });
  } catch (error) {
    console.error('Error fetching value history:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch value history',
      },
      { status: 500 }
    );
  }
}
