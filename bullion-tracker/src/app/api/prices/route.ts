import { NextResponse } from 'next/server';
import { fetchSpotPrices } from '@/lib/prices';

export const dynamic = 'force-dynamic'; // Don't cache this route

/**
 * GET /api/prices
 * Returns current spot prices for gold, silver, and platinum
 */
export async function GET() {
  try {
    const prices = await fetchSpotPrices();

    return NextResponse.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch spot prices',
      },
      { status: 500 }
    );
  }
}
