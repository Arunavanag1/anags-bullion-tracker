import { NextResponse } from 'next/server';
import { getPriceForDate } from '@/lib/historical-data';
import { fetchSpotPrices } from '@/lib/prices';

export const dynamic = 'force-dynamic';

interface MetalPerformance {
  metal: 'gold' | 'silver' | 'platinum';
  currentPrice: number;
  priceOneMonthAgo: number;
  change: number;
  changePercent: number;
}

interface PerformanceResponse {
  metals: MetalPerformance[];
  bestPerformer: MetalPerformance;
  worstPerformer: MetalPerformance;
  periodDays: number;
}

/**
 * GET /api/prices/performance
 * Returns 30-day price performance for all metals
 */
export async function GET() {
  try {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get live current prices and historical prices from 30 days ago
    const liveSpotPrices = await fetchSpotPrices();
    const historicalPrices = getPriceForDate(oneMonthAgo);

    // Use live prices for current
    const currentPrices = {
      gold: liveSpotPrices.gold.pricePerOz,
      silver: liveSpotPrices.silver.pricePerOz,
      platinum: liveSpotPrices.platinum.pricePerOz,
    };

    // Calculate performance for each metal
    const metals: MetalPerformance[] = (['gold', 'silver', 'platinum'] as const).map((metal) => {
      const currentPrice = currentPrices[metal];
      const priceOneMonthAgo = historicalPrices[metal];
      const change = currentPrice - priceOneMonthAgo;
      const changePercent = (change / priceOneMonthAgo) * 100;

      return {
        metal,
        currentPrice: Math.round(currentPrice * 100) / 100,
        priceOneMonthAgo: Math.round(priceOneMonthAgo * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    });

    // Sort by performance to find best and worst
    const sortedByPerformance = [...metals].sort((a, b) => b.changePercent - a.changePercent);
    const bestPerformer = sortedByPerformance[0];
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];

    const response: PerformanceResponse = {
      metals,
      bestPerformer,
      worstPerformer,
      periodDays: 30,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error calculating price performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate price performance' },
      { status: 500 }
    );
  }
}
