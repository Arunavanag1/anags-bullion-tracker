import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { fetchSpotPrices } from '@/lib/prices';
import { calculateCollectionSummary } from '@/lib/calculations';
import type { CollectionItem } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portfolio/summary
 * Returns portfolio summary with totals and breakdown
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: {
          totalItems: 0,
          goldOz: 0,
          silverOz: 0,
          platinumOz: 0,
          totalMeltValue: 0,
          totalBookValue: 0,
          totalCostBasis: 0,
          preciousMetalGoldOz: 0,
          preciousMetalSilverOz: 0,
          preciousMetalPlatinumOz: 0,
        },
      });
    }

    const items = await prisma.collectionItem.findMany({
      where: {
        userId: session.user.id,
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
