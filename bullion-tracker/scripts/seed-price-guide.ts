/**
 * Seed script to populate CoinPriceGuide with sample data
 * Run with: npx tsx scripts/seed-price-guide.ts
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config();

const connectionString = process.env.DATABASE_URL || 'postgresql://arunavanag@localhost:5432/bullion_tracker';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Common grades with typical price multipliers for Morgan Dollars
// These are example multipliers - actual prices vary by coin
const GRADE_PRICES: { [key: string]: number } = {
  'G4': 25,
  'VG8': 28,
  'F12': 30,
  'VF20': 32,
  'VF30': 35,
  'XF40': 40,
  'XF45': 45,
  'AU50': 55,
  'AU53': 60,
  'AU55': 65,
  'AU58': 75,
  'MS60': 85,
  'MS61': 90,
  'MS62': 100,
  'MS63': 125,
  'MS64': 200,
  'MS65': 450,
  'MS66': 1200,
  'MS67': 5000,
  'MS68': 25000,
  'PR60': 150,
  'PR61': 175,
  'PR62': 200,
  'PR63': 250,
  'PR64': 350,
  'PR65': 600,
  'PR66': 1500,
  'PR67': 4000,
  'PR68': 12000,
  'PR69': 35000,
  'PR70': 150000,
};

async function seedPriceGuide() {
  console.log('🌱 Seeding price guide data...\n');

  try {
    // First, ensure all common grades exist in ValidGrade table
    console.log('Creating grade definitions...');

    for (const [gradeCode, basePrice] of Object.entries(GRADE_PRICES)) {
      const numericValue = parseInt(gradeCode.match(/\d+/)?.[0] || '0');
      const prefix = gradeCode.replace(/\d+/g, '');

      const category =
        prefix === 'MS' ? 'Mint State' :
        prefix === 'PR' || prefix === 'PF' ? 'Proof' :
        prefix === 'AU' ? 'About Uncirculated' :
        prefix === 'XF' ? 'Extremely Fine' :
        prefix === 'VF' ? 'Very Fine' :
        prefix === 'F' ? 'Fine' :
        prefix === 'VG' ? 'Very Good' :
        prefix === 'G' ? 'Good' : 'Circulated';

      await prisma.validGrade.upsert({
        where: { gradeCode },
        update: {},
        create: {
          gradeCode,
          numericValue,
          gradeCategory: category,
          displayOrder: numericValue,
        },
      });
    }

    console.log(`✓ Created ${Object.keys(GRADE_PRICES).length} grade definitions\n`);

    // Get all Morgan Dollars and Peace Dollars from the database
    const coins = await prisma.coinReference.findMany({
      where: {
        OR: [
          { series: { contains: 'Morgan', mode: 'insensitive' } },
          { series: { contains: 'Peace', mode: 'insensitive' } },
        ],
      },
    });

    console.log(`Found ${coins.length} Morgan/Peace dollars to price\n`);

    const priceDate = new Date();
    let totalPrices = 0;

    for (const coin of coins) {
      console.log(`Pricing ${coin.fullName}...`);
      let coinPrices = 0;

      // Add price guide entries for each grade
      for (const [gradeCode, basePrice] of Object.entries(GRADE_PRICES)) {
        // Add some variation based on year and mintmark for realism
        const yearFactor = coin.year < 1900 ? 1.5 : 1.0;
        const mintFactor = coin.mintMark === 'CC' ? 3.0 : coin.mintMark === 'S' ? 1.2 : 1.0;
        const finalPrice = basePrice * yearFactor * mintFactor;

        await prisma.coinPriceGuide.upsert({
          where: {
            coinReferenceId_gradeCode_priceDate: {
              coinReferenceId: coin.id,
              gradeCode,
              priceDate,
            },
          },
          update: {
            pcgsPrice: finalPrice,
          },
          create: {
            coinReferenceId: coin.id,
            gradeCode,
            pcgsPrice: finalPrice,
            priceDate,
          },
        });

        coinPrices++;
        totalPrices++;
      }

      console.log(`  ✓ Added ${coinPrices} prices\n`);
    }

    console.log('\n✅ Seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Coins priced: ${coins.length}`);
    console.log(`   - Total price entries: ${totalPrices}`);
    console.log(`   - Grades per coin: ${Object.keys(GRADE_PRICES).length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

seedPriceGuide();
