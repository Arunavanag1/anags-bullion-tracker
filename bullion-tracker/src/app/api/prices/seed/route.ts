import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Realistic base prices (as of Jan 2026)
const basePrices = {
  gold: 2650,
  silver: 31.85,
  platinum: 982
};

// Generate realistic price variations for 5 days
function generateHistoricalPrices(metal: string, basePrice: number, days = 5) {
  const prices = [];
  let currentPrice = basePrice;

  for (let i = days - 1; i >= 0; i--) {
    // Random daily change between -2% and +2%
    const changePercent = (Math.random() - 0.5) * 4;
    const change = currentPrice * (changePercent / 100);
    currentPrice = currentPrice + change;

    // Create timestamp for this day (at 12:00 PM)
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0);

    prices.push({
      metal,
      priceOz: parseFloat(currentPrice.toFixed(2)),
      timestamp: date
    });
  }

  return prices;
}

/**
 * POST /api/prices/seed
 * Seeds historical price data for the last 5 days
 * Protected: Only available in development mode
 */
export async function POST(request: NextRequest) {
  // Security: Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // Optional admin key check for dev environments
  const adminKey = request.headers.get('x-admin-key');
  if (process.env.ADMIN_SEED_KEY && adminKey !== process.env.ADMIN_SEED_KEY) {
    return NextResponse.json(
      { error: 'Invalid admin key' },
      { status: 403 }
    );
  }

  try {
    console.log('🌱 Seeding historical price data for the last 5 days...');

    // Check if we already have data
    const existingCount = await prisma.priceHistory.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing price records.`);
      console.log('Deleting existing records to avoid duplicates...');
      await prisma.priceHistory.deleteMany({});
    }

    // Generate prices for each metal
    const goldPrices = generateHistoricalPrices('gold', basePrices.gold);
    const silverPrices = generateHistoricalPrices('silver', basePrices.silver);
    const platinumPrices = generateHistoricalPrices('platinum', basePrices.platinum);

    // Insert all prices
    const allPrices = [...goldPrices, ...silverPrices, ...platinumPrices];

    console.log(`📊 Inserting ${allPrices.length} price records...`);
    await prisma.priceHistory.createMany({
      data: allPrices
    });

    console.log('✅ Successfully seeded historical price data!');

    // Get summary
    const summary = await prisma.priceHistory.groupBy({
      by: ['metal'],
      _count: true
    });

    // Get most recent prices with changes
    const recentPrices: Record<string, { price: number; change: number; changePercent: number }> = {};
    for (const metal of ['gold', 'silver', 'platinum']) {
      const latest = await prisma.priceHistory.findFirst({
        where: { metal },
        orderBy: { timestamp: 'desc' }
      });

      const previous = await prisma.priceHistory.findFirst({
        where: {
          metal,
          timestamp: { lt: latest!.timestamp }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (latest && previous) {
        const change = latest.priceOz - previous.priceOz;
        const changePercent = (change / previous.priceOz) * 100;
        recentPrices[metal] = {
          price: latest.priceOz,
          change,
          changePercent
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded 5 days of historical price data',
      summary: summary.map(s => ({ metal: s.metal, records: s._count })),
      recentPrices
    });

  } catch (error) {
    console.error('Error seeding prices:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed price data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
