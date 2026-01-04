import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchSpotPrices } from '@/lib/prices';
import { calculateCollectionSummary } from '@/lib/calculations';
import type { CollectionItem } from '@/types';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'default-user';

/**
 * GET /api/portfolio/summary
 * Returns portfolio summary with totals and breakdown
 */
export async function GET() {
  try {
    const items = await prisma.collectionItem.findMany({
      where: {
        userId: DEFAULT_USER_ID,
      },
      include: {
        images: true,
      },
    });

    const prices = await fetchSpotPrices();
    const spotPrices = {
      gold: prices.gold.pricePerOz,
      silver: prices.silver.pricePerOz,
      platinum: prices.platinum.pricePerOz,
    };

    // Convert Prisma items to CollectionItem type
    const collectionItems = items.map((item) => ({
      ...item,
      type: item.type as 'itemized' | 'bulk',
      metal: item.metal as 'gold' | 'silver' | 'platinum',
      bookValueType: item.bookValueType as 'custom' | 'spot',
      images: item.images.map((img) => img.url),
    })) as CollectionItem[];

    const summary = calculateCollectionSummary(collectionItems, spotPrices);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio summary',
      },
      { status: 500 }
    );
  }
}
