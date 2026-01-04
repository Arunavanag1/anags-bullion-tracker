import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalPrices } from '@/lib/prices';

export const dynamic = 'force-dynamic';

/**
 * GET /api/prices/history
 * Query params: metal, startDate, endDate
 * Returns historical price data for charts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metal = searchParams.get('metal') as 'gold' | 'silver' | 'platinum';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!metal || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: metal, startDate, endDate',
        },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format',
        },
        { status: 400 }
      );
    }

    const prices = await fetchHistoricalPrices(metal, start, end);

    return NextResponse.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error('Error fetching historical prices:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch historical prices',
      },
      { status: 500 }
    );
  }
}
