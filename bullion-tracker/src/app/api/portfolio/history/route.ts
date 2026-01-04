import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchSpotPrices } from '@/lib/prices';
import { generateDailyPrices } from '@/lib/historical-data';
import { calculateCurrentMeltValue, calculateCurrentBookValue } from '@/lib/calculations';
import type { CollectionItem } from '@/types';

export const dynamic = 'force-dynamic';

interface HistoricalPoint {
  date: string;
  meltValue: number;
  bookValue: number;
  timestamp: number;
}

/**
 * GET /api/portfolio/history
 * Query params:
 *   - days: number of days to look back (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch collection items
    const items = await prisma.collectionItem.findMany({
      include: {
        images: true,
      },
    });

    if (items.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Convert to CollectionItem type
    const collection: CollectionItem[] = items.map((item) => {
      const baseItem = {
        id: item.id,
        userId: item.userId,
        metal: item.metal as 'gold' | 'silver' | 'platinum',
        weightOz: item.weightOz,
        bookValueType: item.bookValueType as 'spot' | 'custom',
        spotPriceAtCreation: item.spotPriceAtCreation,
        customBookValue: item.customBookValue || undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        images: item.images.map((img) => img.url),
      };

      if (item.type === 'itemized') {
        return {
          ...baseItem,
          type: 'itemized' as const,
          title: item.title || '',
          quantity: item.quantity || 1,
          grade: item.grade || undefined,
          gradingService: item.gradingService || undefined,
          notes: item.notes || undefined,
        };
      } else {
        return {
          ...baseItem,
          type: 'bulk' as const,
          notes: item.notes || undefined,
        };
      }
    });

    // Generate historical prices from our curated database
    console.log(`Generating historical prices from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Determine interval based on time range
    const interval = days > 365 ? 7 : days > 30 ? 3 : 1; // days between points

    // Get historical prices from our database with interpolation
    const historicalPrices = generateDailyPrices(startDate, endDate, interval);

    console.log(`Generated ${historicalPrices.length} historical price points from database`);

    if (historicalPrices.length > 0) {
      console.log('Sample data point:', {
        date: historicalPrices[0].timestamp,
        gold: historicalPrices[0].gold.toFixed(2),
        silver: historicalPrices[0].silver.toFixed(2),
        platinum: historicalPrices[0].platinum.toFixed(2),
      });
    }

    // Calculate portfolio values for each historical point
    const portfolioHistory: HistoricalPoint[] = historicalPrices.map((pricePoint) => {
      let meltValue = 0;
      let bookValue = 0;

      collection.forEach((item) => {
        const spotPrice = pricePoint[item.metal];
        meltValue += calculateCurrentMeltValue(item, spotPrice);
        bookValue += calculateCurrentBookValue(item, spotPrice);
      });

      const timestamp = pricePoint.timestamp.getTime();
      const date = pricePoint.timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(days > 365 && { year: '2-digit' }),
      });

      return {
        date,
        meltValue: Math.round(meltValue * 100) / 100,
        bookValue: Math.round(bookValue * 100) / 100,
        timestamp,
      };
    });

    return NextResponse.json({ data: portfolioHistory });
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    );
  }
}
