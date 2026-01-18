import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel free tier limit

/**
 * GET /api/cron/refresh-prices
 *
 * Cron endpoint for daily price refresh. Updates a small batch of coins
 * using existing CoinPriceGuide data to update CollectionItem values.
 *
 * This endpoint is called by Vercel Cron and performs:
 * 1. Verifies CRON_SECRET for security
 * 2. Updates collection items with latest guide prices
 * 3. Creates value history entries
 *
 * Note: Due to Vercel's 10-second execution limit on free tier, this endpoint
 * updates existing price guide data to collection items. The actual PCGS API
 * price fetching is handled by the Python script (refresh_prices.py) which
 * should be run separately via a more capable execution environment.
 *
 * Schedule: Daily at 6 AM UTC (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Get all guide_price items that need syncing
    const items = await prisma.collectionItem.findMany({
      where: {
        bookValueType: 'guide_price',
        coinReferenceId: { not: null },
        grade: { not: null },
      },
      select: {
        id: true,
        userId: true,
        coinReferenceId: true,
        grade: true,
        numismaticValue: true,
      },
      take: 100, // Limit to stay within execution time
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          synced: 0,
          updated: 0,
          message: 'No guide_price items to sync',
          durationMs: Date.now() - startTime,
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter valid items
    const validItems = items.filter(
      (item) => item.coinReferenceId && item.grade
    );

    // Build price lookup keys
    const priceKeys = validItems.map((item) => ({
      coinReferenceId: item.coinReferenceId!,
      gradeCode: item.grade!,
    }));

    // Batch fetch latest prices
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
    const priceGuideMap = new Map<string, (typeof allPriceGuides)[0]>();
    for (const pg of allPriceGuides) {
      const key = `${pg.coinReferenceId}-${pg.gradeCode}`;
      if (!priceGuideMap.has(key)) {
        priceGuideMap.set(key, pg);
      }
    }

    // Prepare batch updates
    const updateOperations: ReturnType<typeof prisma.collectionItem.update>[] =
      [];
    const historyOperations: ReturnType<typeof prisma.itemValueHistory.upsert>[] =
      [];
    let updated = 0;

    for (const item of validItems) {
      const key = `${item.coinReferenceId}-${item.grade}`;
      const priceGuide = priceGuideMap.get(key);

      if (!priceGuide) continue;

      // Get guide value (prefer greysheet)
      const guideValue = priceGuide.greysheetPrice
        ? parseFloat(priceGuide.greysheetPrice.toString())
        : priceGuide.pcgsPrice
          ? parseFloat(priceGuide.pcgsPrice.toString())
          : null;

      if (guideValue === null) continue;

      const source = priceGuide.greysheetPrice ? 'greysheet' : 'pcgs';

      // Update if changed
      if (item.numismaticValue !== guideValue) {
        updateOperations.push(
          prisma.collectionItem.update({
            where: { id: item.id },
            data: { numismaticValue: guideValue },
          })
        );
        updated++;
      }

      // Add history entry
      historyOperations.push(
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

    // Execute transaction
    if (updateOperations.length > 0 || historyOperations.length > 0) {
      await prisma.$transaction([...updateOperations, ...historyOperations]);
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        synced: validItems.length,
        updated,
        pricesFound: priceGuideMap.size,
        message: `Synced ${validItems.length} items, updated ${updated} values`,
        durationMs,
      },
    });
  } catch (error) {
    console.error('Cron refresh-prices error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
