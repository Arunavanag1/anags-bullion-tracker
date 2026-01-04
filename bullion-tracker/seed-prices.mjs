import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bullion_tracker';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

// Realistic base prices (as of Jan 2026)
const basePrices = {
  gold: 2650,
  silver: 31.85,
  platinum: 982
};

// Generate realistic price variations for 5 days
function generateHistoricalPrices(metal, basePrice, days = 5) {
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

    console.log(`${metal} on ${date.toDateString()}: $${currentPrice.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
  }

  return prices;
}

async function seedPrices() {
  console.log('🌱 Seeding historical price data for the last 5 days...\n');

  try {
    // Check if we already have data
    const existingCount = await prisma.priceHistory.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing price records.`);
      console.log('Deleting existing records to avoid duplicates...\n');
      await prisma.priceHistory.deleteMany({});
    }

    // Generate prices for each metal
    const goldPrices = generateHistoricalPrices('gold', basePrices.gold);
    console.log('');

    const silverPrices = generateHistoricalPrices('silver', basePrices.silver);
    console.log('');

    const platinumPrices = generateHistoricalPrices('platinum', basePrices.platinum);
    console.log('');

    // Insert all prices
    const allPrices = [...goldPrices, ...silverPrices, ...platinumPrices];

    console.log(`📊 Inserting ${allPrices.length} price records...`);
    await prisma.priceHistory.createMany({
      data: allPrices
    });

    console.log('✅ Successfully seeded historical price data!\n');

    // Show summary
    const summary = await prisma.priceHistory.groupBy({
      by: ['metal'],
      _count: true
    });

    console.log('Summary:');
    summary.forEach(s => {
      console.log(`  ${s.metal}: ${s._count} records`);
    });

    // Show most recent prices
    console.log('\nMost recent prices:');
    for (const metal of ['gold', 'silver', 'platinum']) {
      const latest = await prisma.priceHistory.findFirst({
        where: { metal },
        orderBy: { timestamp: 'desc' }
      });

      const previous = await prisma.priceHistory.findFirst({
        where: {
          metal,
          timestamp: { lt: latest.timestamp }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (previous) {
        const change = latest.priceOz - previous.priceOz;
        const changePercent = (change / previous.priceOz) * 100;
        console.log(`  ${metal}: $${latest.priceOz.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding prices:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedPrices()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
