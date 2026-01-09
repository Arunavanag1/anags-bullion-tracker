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

    const coinPerformances: CoinPerformance[] = [];

    for (const item of numismaticItems) {
      if (!item.coinReferenceId || !item.grade) continue;

      // Get most recent price
      const currentPriceRecord = await prisma.coinPriceGuide.findFirst({
        where: {
          coinReferenceId: item.coinReferenceId,
          gradeCode: item.grade.replace('~', ''), // Remove estimate marker
        },
        orderBy: { priceDate: 'desc' },
      });

      // Get price from approximately 30 days ago
      const historicalPriceRecord = await prisma.coinPriceGuide.findFirst({
        where: {
          coinReferenceId: item.coinReferenceId,
          gradeCode: item.grade.replace('~', ''),
          priceDate: { lte: oneMonthAgo },
        },
        orderBy: { priceDate: 'desc' },
      });

      // If we don't have historical data, use the current price as baseline
      if (currentPriceRecord) {
        const currentPrice = Number(currentPriceRecord.pcgsPrice);
        const priceOneMonthAgo = historicalPriceRecord
          ? Number(historicalPriceRecord.pcgsPrice)
          : currentPrice;

        const change = currentPrice - priceOneMonthAgo;
        const changePercent = priceOneMonthAgo > 0 ? (change / priceOneMonthAgo) * 100 : 0;

        // Look up coin reference for the title if not set
        let coinTitle = item.title || 'Unknown Coin';
        if (!item.title && item.coinReferenceId) {
          const coinRef = await prisma.coinReference.findUnique({
            where: { id: item.coinReferenceId },
          });
          coinTitle = coinRef?.fullName || 'Unknown Coin';
        }

        coinPerformances.push({
          id: item.id,
          title: coinTitle,
          grade: item.grade,
          coinReferenceId: item.coinReferenceId,
          currentPrice: Math.round(currentPrice * 100) / 100,
          priceOneMonthAgo: Math.round(priceOneMonthAgo * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          priceSource: 'PCGS', // Will add Greysheet support later
        });
      }
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
