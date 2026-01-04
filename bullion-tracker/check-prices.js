const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.priceHistory.count();
  console.log('Total price history records:', count);

  if (count > 0) {
    const recent = await prisma.priceHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    console.log('\nRecent records:');
    recent.forEach(r => {
      console.log(`  ${r.metal}: $${r.priceOz.toFixed(2)} at ${r.timestamp}`);
    });

    // Check for yesterday's data
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayCount = await prisma.priceHistory.count({
      where: { timestamp: { lte: yesterday } }
    });
    console.log(`\nRecords older than 24h: ${yesterdayCount}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
