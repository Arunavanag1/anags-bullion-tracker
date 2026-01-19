import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CoinPerformance {
  id: string;
  title: string;
  grade: string;
  coinReferenceId: string;
  currentPrice: number;
  priceOneMonthAgo: number;
  change: number;
  changePercent: number;
  priceSource: string;
}

interface CoinPerformanceResponse {
  coins: CoinPerformance[];
  bestPerformer: CoinPerformance | null;
  worstPerformer: CoinPerformance | null;
  periodDays: number;
}

/**
 * GET /api/coins/performance
 * Returns 30-day price performance for user's numismatic coins
 */
export async function GET() {
  try {
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all numismatic collection items
    const numismaticItems = await prisma.collectionItem.findMany({
      where: {
        category: 'NUMISMATIC',
        coinReferenceId: { not: null },
      },
    });

    if (numismaticItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          coins: [],
          bestPerformer: null,
          worstPerformer: null,
          periodDays: 30,
        } as CoinPerformanceResponse,
      });
    }

    // Filter items with valid coinReferenceId and grade
    const validItems = numismaticItems.filter(
      (item: typeof numismaticItems[number]) => item.coinReferenceId && item.grade
    );

    if (validItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          coins: [],
          bestPerformer: null,
          worstPerformer: null,
          periodDays: 30,
        } as CoinPerformanceResponse,
      });
    }

    // Extract unique coinReferenceId + gradeCode pairs for batch queries
    const priceKeys = validItems.map((item) => ({
      coinReferenceId: item.coinReferenceId!,
      gradeCode: item.grade!.replace('~', ''),
    }));

    // Batch fetch all current prices (most recent for each coin+grade)
    const allPrices = await prisma.coinPriceGuide.findMany({
      where: {
        OR: priceKeys.map((key) => ({
          coinReferenceId: key.coinReferenceId,
          gradeCode: key.gradeCode,
        })),
      },
      orderBy: { priceDate: 'desc' },
    });

    // Build lookup maps for current prices (most recent) and historical prices (before oneMonthAgo)
    const currentPriceMap = new Map<string, typeof allPrices[0]>();
    const historicalPriceMap = new Map<string, typeof allPrices[0]>();

    for (const price of allPrices) {
      const key = `${price.coinReferenceId}-${price.gradeCode}`;

      // Track most recent price (first one due to orderBy desc)
      if (!currentPriceMap.has(key)) {
        currentPriceMap.set(key, price);
      }

      // Track most recent historical price (before oneMonthAgo)
      if (price.priceDate <= oneMonthAgo && !historicalPriceMap.has(key)) {
        historicalPriceMap.set(key, price);
      }
    }

    // Batch fetch coin references for items without titles
    const itemsNeedingTitles = validItems.filter((item) => !item.title);
    const coinRefIdsForTitles = [...new Set(itemsNeedingTitles.map((item) => item.coinReferenceId!))];

    const coinRefs = coinRefIdsForTitles.length > 0
      ? await prisma.coinReference.findMany({
          where: { id: { in: coinRefIdsForTitles } },
          select: { id: true, fullName: true },
        })
      : [];

    const coinRefMap = new Map(coinRefs.map((ref) => [ref.id, ref.fullName]));

    // Process items using lookup maps (no per-item queries)
    const coinPerformances: CoinPerformance[] = [];

    for (const item of validItems) {
      const gradeCode = item.grade!.replace('~', '');
      const key = `${item.coinReferenceId}-${gradeCode}`;

      const currentPriceRecord = currentPriceMap.get(key);
      if (!currentPriceRecord) continue;

      const historicalPriceRecord = historicalPriceMap.get(key);

      const currentPrice = Number(currentPriceRecord.pcgsPrice);
      const priceOneMonthAgo = historicalPriceRecord
        ? Number(historicalPriceRecord.pcgsPrice)
        : currentPrice;

      const change = currentPrice - priceOneMonthAgo;
      const changePercent = priceOneMonthAgo > 0 ? (change / priceOneMonthAgo) * 100 : 0;

      // Use item title, or lookup from coinRefMap, or fallback
      const coinTitle = item.title || coinRefMap.get(item.coinReferenceId!) || 'Unknown Coin';

      coinPerformances.push({
        id: item.id,
        title: coinTitle,
        grade: item.grade!,
        coinReferenceId: item.coinReferenceId!,
        currentPrice: Math.round(currentPrice * 100) / 100,
        priceOneMonthAgo: Math.round(priceOneMonthAgo * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        priceSource: 'PCGS',
      });
    }

    // Sort by performance
    const sortedByPerformance = [...coinPerformances].sort(
      (a, b) => b.changePercent - a.changePercent
    );

    const bestPerformer = sortedByPerformance.length > 0 ? sortedByPerformance[0] : null;
    const worstPerformer = sortedByPerformance.length > 0
      ? sortedByPerformance[sortedByPerformance.length - 1]
      : null;

    const response: CoinPerformanceResponse = {
      coins: coinPerformances,
      bestPerformer,
      worstPerformer,
      periodDays: 30,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error calculating coin performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate coin performance' },
      { status: 500 }
    );
  }
}
