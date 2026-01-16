import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/collection/sync-prices
 * Sync guide prices for numismatic items (bookValueType='guide_price')
 *
 * Body:
 *   - itemId?: string - Optional single item to sync, otherwise syncs all user's guide_price items
 *
 * For each guide_price item:
 *   1. Fetch latest CoinPriceGuide by coinReferenceId + gradeCode
 *   2. Update numismaticValue if different
 *   3. Create ItemValueHistory entry with today's date
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json().catch(() => ({}));
    const { itemId } = body;

    // Get items to sync
    const whereClause: any = {
      userId,
      bookValueType: 'guide_price',
      coinReferenceId: { not: null },
      grade: { not: null },
    };

    if (itemId) {
      whereClause.id = itemId;
    }

    const items = await prisma.collectionItem.findMany({
      where: whereClause,
      select: {
        id: true,
        coinReferenceId: true,
        grade: true,
        numismaticValue: true,
      },
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          synced: 0,
          updated: 0,
          message: itemId ? 'Item not found or not a guide_price item' : 'No guide_price items to sync',
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter items with valid coinReferenceId and grade
    const validItems = items.filter((item) => item.coinReferenceId && item.grade);

    if (validItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          synced: 0,
          updated: 0,
          message: 'No valid items to sync',
        },
      });
    }

    // Extract unique (coinReferenceId, grade) pairs for batch query
    const priceKeys = validItems.map((item) => ({
      coinReferenceId: item.coinReferenceId!,
      gradeCode: item.grade!,
    }));

    // Batch fetch all price guides
    const allPriceGuides = await prisma.coinPriceGuide.findMany({
      where: {
        OR: priceKeys.map((key) => ({
          coinReferenceId: key.coinReferenceId,
          gradeCode: key.gradeCode,
        })),
      },
      orderBy: { priceDate: 'desc' },
    });

    // Build lookup map (most recent price per coin+grade)
    const priceGuideMap = new Map<string, typeof allPriceGuides[0]>();
    for (const pg of allPriceGuides) {
      const key = `${pg.coinReferenceId}-${pg.gradeCode}`;
      if (!priceGuideMap.has(key)) {
        priceGuideMap.set(key, pg);
      }
    }

    // Prepare batch operations
    const updateOperations: ReturnType<typeof prisma.collectionItem.update>[] = [];
    const upsertOperations: ReturnType<typeof prisma.itemValueHistory.upsert>[] = [];
    let updated = 0;

    for (const item of validItems) {
      const key = `${item.coinReferenceId}-${item.grade}`;
      const priceGuide = priceGuideMap.get(key);

      if (!priceGuide) continue;

      // Determine value from price guide (prefer greysheet, fallback to pcgs)
      const guideValue = priceGuide.greysheetPrice
        ? parseFloat(priceGuide.greysheetPrice.toString())
        : priceGuide.pcgsPrice
          ? parseFloat(priceGuide.pcgsPrice.toString())
          : null;

      if (guideValue === null) continue;

      // Determine source
      const source = priceGuide.greysheetPrice ? 'greysheet' : 'pcgs';

      // Queue update if value changed
      if (item.numismaticValue !== guideValue) {
        updateOperations.push(
          prisma.collectionItem.update({
            where: { id: item.id },
            data: { numismaticValue: guideValue },
          })
        );
        updated++;
      }

      // Queue upsert for value history
      upsertOperations.push(
        prisma.itemValueHistory.upsert({
          where: {
            collectionItemId_priceDate: {
              collectionItemId: item.id,
              priceDate: today,
            },
          },
          update: {
            value: guideValue,
            source,
          },
          create: {
            collectionItemId: item.id,
            valueType: 'guide_price',
            value: guideValue,
            priceDate: today,
            source,
          },
        })
      );
    }

    // Execute all writes in a single transaction
    if (updateOperations.length > 0 || upsertOperations.length > 0) {
      await prisma.$transaction([...updateOperations, ...upsertOperations]);
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: items.length,
        updated,
        message: `Synced ${items.length} items, updated ${updated}`,
      },
    });
  } catch (error: any) {
    console.error('Error syncing prices:', error);

    if (error.message === 'Unauthorized') {
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
        error: 'Failed to sync prices',
      },
      { status: 500 }
    );
  }
}
