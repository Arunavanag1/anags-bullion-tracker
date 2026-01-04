import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    const items = await prisma.collectionItem.findMany({
      where: { userId },
      include: {
        images: true,
      },
    });

    // Calculate total value
    const getValue = (item: typeof items[0]) => {
      if (item.customBookValue) return Number(item.customBookValue);
      if (item.numismaticValue) return Number(item.numismaticValue);
      // For bullion, calculate spot value (would need to fetch current spot prices)
      return item.spotPriceAtCreation && item.weightOz
        ? Number(item.spotPriceAtCreation) * Number(item.weightOz) * Number(item.quantity)
        : 0;
    };

    const totalValue = items.reduce((sum, item) => sum + getValue(item), 0);

    // Separate by category
    const bullionItems = items.filter(i => i.category === 'BULLION');
    const numismaticItems = items.filter(i => i.category === 'NUMISMATIC');

    const bullionValue = bullionItems.reduce((sum, item) => sum + getValue(item), 0);
    const numismaticValue = numismaticItems.reduce((sum, item) => sum + getValue(item), 0);

    // Bullion breakdown by metal
    const bullionByMetal: Record<string, { value: number; count: number }> = {};
    bullionItems.forEach(item => {
      const metal = item.metal || 'Unknown';
      if (!bullionByMetal[metal]) {
        bullionByMetal[metal] = { value: 0, count: 0 };
      }
      bullionByMetal[metal].value += getValue(item);
      bullionByMetal[metal].count += Number(item.quantity);
    });

    // Numismatic breakdown by series (would need coinReference join)
    // For now, simplified version
    const numismaticBySeries: Record<string, { value: number; count: number }> = {};
    numismaticItems.forEach(item => {
      const series = 'Various'; // Would get from coinReference
      if (!numismaticBySeries[series]) {
        numismaticBySeries[series] = { value: 0, count: 0 };
      }
      numismaticBySeries[series].value += getValue(item);
      numismaticBySeries[series].count += 1;
    });

    return NextResponse.json({
      totalValue,
      totalItems: items.length,
      bullionValue,
      bullionCount: bullionItems.length,
      numismaticValue,
      numismaticCount: numismaticItems.length,
      bullionByMetal,
      numismaticBySeries,
    });
  } catch (error) {
    console.error('Collection summary error:', error);
    return NextResponse.json({ error: 'Failed to get summary' }, { status: 500 });
  }
}
