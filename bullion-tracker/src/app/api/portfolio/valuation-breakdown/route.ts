import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { fetchSpotPrices } from '@/lib/prices';
import { calculateCurrentMeltValue } from '@/lib/calculations';
import type { ValuationBreakdown } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portfolio/valuation-breakdown
 * Returns portfolio breakdown by valuation type (spot_premium, guide_price, custom)
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: {
          spotPremium: { count: 0, totalValue: 0, totalPremium: 0, avgPremiumPercent: 0 },
          guidePrice: { count: 0, totalValue: 0, totalMeltValue: 0, premiumOverMelt: 0 },
          custom: { count: 0, totalValue: 0 },
          lastSyncDate: null,
        } as ValuationBreakdown,
      });
    }

    const items = await prisma.collectionItem.findMany({
      where: {
        userId: session.user.id,
      },
    });

    const prices = await fetchSpotPrices();
    const spotPrices: Record<string, number> = {
      gold: prices.gold.pricePerOz,
      silver: prices.silver.pricePerOz,
      platinum: prices.platinum.pricePerOz,
    };

    // Initialize breakdown
    const breakdown: ValuationBreakdown = {
      spotPremium: { count: 0, totalValue: 0, totalPremium: 0, avgPremiumPercent: 0 },
      guidePrice: { count: 0, totalValue: 0, totalMeltValue: 0, premiumOverMelt: 0 },
      custom: { count: 0, totalValue: 0 },
      lastSyncDate: null,
    };

    // Track for averaging
    let spotPremiumTotalPercent = 0;

    items.forEach((item) => {
      const spotPrice = spotPrices[item.metal] || 0;
      const quantity = item.type === 'itemized' ? item.quantity : 1;
      const totalWeight = (item.weightOz || 0) * quantity;
      const meltValue = totalWeight * spotPrice;

      // Handle legacy 'spot' as 'spot_premium'
      const valueType = item.bookValueType === 'spot' ? 'spot_premium' : item.bookValueType;

      switch (valueType) {
        case 'spot_premium': {
          const premiumPercent = item.premiumPercent || 0;
          const premiumMultiplier = 1 + (premiumPercent / 100);
          const totalValue = meltValue * premiumMultiplier;
          const premiumAmount = totalValue - meltValue;

          breakdown.spotPremium.count += 1;
          breakdown.spotPremium.totalValue += totalValue;
          breakdown.spotPremium.totalPremium += premiumAmount;
          spotPremiumTotalPercent += premiumPercent;
          break;
        }

        case 'guide_price': {
          const guideValue = item.numismaticValue || 0;
          breakdown.guidePrice.count += 1;
          breakdown.guidePrice.totalValue += guideValue;
          breakdown.guidePrice.totalMeltValue += meltValue;
          break;
        }

        case 'custom': {
          const customValue = item.customBookValue || 0;
          breakdown.custom.count += 1;
          breakdown.custom.totalValue += customValue;
          break;
        }
      }
    });

    // Calculate averages
    if (breakdown.spotPremium.count > 0) {
      breakdown.spotPremium.avgPremiumPercent =
        spotPremiumTotalPercent / breakdown.spotPremium.count;
    }

    if (breakdown.guidePrice.count > 0 && breakdown.guidePrice.totalMeltValue > 0) {
      breakdown.guidePrice.premiumOverMelt =
        ((breakdown.guidePrice.totalValue - breakdown.guidePrice.totalMeltValue) /
          breakdown.guidePrice.totalMeltValue) * 100;
    }

    // Get most recent ItemValueHistory priceDate for lastSyncDate
    const latestHistory = await prisma.itemValueHistory.findFirst({
      where: {
        collectionItem: {
          userId: session.user.id,
        },
      },
      orderBy: {
        priceDate: 'desc',
      },
      select: {
        priceDate: true,
      },
    });

    if (latestHistory) {
      breakdown.lastSyncDate = latestHistory.priceDate.toISOString();
    }

    return NextResponse.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Error fetching valuation breakdown:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch valuation breakdown',
      },
      { status: 500 }
    );
  }
}
