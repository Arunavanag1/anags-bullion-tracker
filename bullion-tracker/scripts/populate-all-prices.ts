/**
 * Comprehensive price population script using alternative sources and estimates
 * Run with: npx tsx scripts/populate-all-prices.ts
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as cheerio from 'cheerio';

config();

const connectionString = process.env.DATABASE_URL || 'postgresql://arunavanag@localhost:5432/bullion_tracker';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Base values for different coin series (in lowest circulated grade)
const SERIES_BASE_VALUES: { [key: string]: number } = {
  'Buffalo Nickel': 1.5,
  'Mercury Dime': 2.5,
  'Washington Quarter': 6,
  'Morgan Dollar': 25,
  'Peace Dollar': 22,
  'Walking Liberty Half': 12,
  'Franklin Half': 8,
  'Kennedy Half': 7,
  'Barber Dime': 3,
  'Barber Quarter': 7,
  'Barber Half': 15,
  'Standing Liberty Quarter': 8,
  'Indian Head Cent': 2,
  'Lincoln Cent': 0.15,
  'Jefferson Nickel': 0.50,
};

// Mintmark multipliers
const MINTMARK_MULTIPLIERS: { [key: string]: number } = {
  '': 1.0,      // Philadelphia (no mintmark)
  'D': 1.2,     // Denver
  'S': 1.5,     // San Francisco
  'CC': 4.0,    // Carson City (rare)
  'O': 1.3,     // New Orleans
};

// Grade price multipliers (approximate industry standard)
const GRADE_MULTIPLIERS: { [key: string]: number } = {
  'G4': 1,
  'VG8': 1.1,
  'F12': 1.2,
  'VF20': 1.3,
  'VF30': 1.4,
  'XF40': 1.6,
  'XF45': 1.8,
  'AU50': 2.2,
  'AU53': 2.4,
  'AU55': 2.6,
  'AU58': 3.0,
  'MS60': 3.4,
  'MS61': 3.6,
  'MS62': 4.0,
  'MS63': 5.0,
  'MS64': 8.0,
  'MS65': 18,
  'MS66': 48,
  'MS67': 200,
  'MS68': 1000,
  'PR60': 6,
  'PR61': 7,
  'PR62': 8,
  'PR63': 10,
  'PR64': 14,
  'PR65': 24,
  'PR66': 60,
  'PR67': 160,
  'PR68': 480,
  'PR69': 1400,
  'PR70': 6000,
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSeriesBaseValue(series: string): number {
  // Try exact match first
  for (const [key, value] of Object.entries(SERIES_BASE_VALUES)) {
    if (series.includes(key)) {
      return value;
    }
  }

  // Fallback based on denomination
  if (series.includes('Dollar')) return 20;
  if (series.includes('Half')) return 10;
  if (series.includes('Quarter')) return 6;
  if (series.includes('Dime')) return 2.5;
  if (series.includes('Nickel')) return 1;
  if (series.includes('Cent')) return 0.50;

  return 5; // Default
}

function calculateYearMultiplier(year: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Older coins generally more valuable
  if (year < 1900) return 2.0;
  if (year < 1930) return 1.5;
  if (year < 1950) return 1.2;
  if (year < 1970) return 1.0;
  return 0.9;
}

function estimateCoinPrice(coin: any, gradeCode: string): number {
  const baseValue = getSeriesBaseValue(coin.series);
  const yearMultiplier = calculateYearMultiplier(coin.year);
  const mintMultiplier = MINTMARK_MULTIPLIERS[coin.mintMark || ''] || 1.0;
  const gradeMultiplier = GRADE_MULTIPLIERS[gradeCode] || 1.0;

  const estimatedPrice = baseValue * yearMultiplier * mintMultiplier * gradeMultiplier;

  // Round to reasonable precision
  if (estimatedPrice < 10) return Math.round(estimatedPrice * 100) / 100;
  if (estimatedPrice < 100) return Math.round(estimatedPrice * 10) / 10;
  return Math.round(estimatedPrice);
}

async function tryScrapeCoinTrackers(coin: any, gradeCode: string): Promise<number | null> {
  try {
    // Build search-friendly URL
    const searchTerm = `${coin.year} ${coin.series} ${coin.mintMark || ''}`.trim().replace(/\s+/g, '-').toLowerCase();
    const url = `https://www.cointrackers.com/coins/${searchTerm}/`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to find price tables
    let price: number | null = null;

    $('table tr').each((i, row) => {
      const $row = $(row);
      const rowText = $row.text();

      if (rowText.includes(gradeCode)) {
        const priceText = $row.find('td').last().text();
        const match = priceText.match(/\$?([\d,]+\.?\d*)/);
        if (match) {
          price = parseFloat(match[1].replace(/,/g, ''));
        }
      }
    });

    return price;
  } catch (error) {
    return null;
  }
}

async function populateAllPrices() {
  console.log('🚀 Starting comprehensive price population...\n');

  try {
    // Ensure all grades exist
    console.log('Creating grade definitions...');
    const gradeCount = Object.keys(GRADE_MULTIPLIERS).length;

    for (const [gradeCode, multiplier] of Object.entries(GRADE_MULTIPLIERS)) {
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

    console.log(`✓ Created ${gradeCount} grade definitions\n`);

    // Get all coins
    const coins = await prisma.coinReference.findMany({
      orderBy: {
        series: 'asc',
      },
    });

    console.log(`📊 Found ${coins.length} coins to price\n`);

    const priceDate = new Date();
    let totalPrices = 0;
    let scrapedCount = 0;
    let estimatedCount = 0;

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      const progress = `[${i + 1}/${coins.length}]`;

      console.log(`${progress} ${coin.fullName}`);

      let coinPrices = 0;

      // Process each grade
      for (const gradeCode of Object.keys(GRADE_MULTIPLIERS)) {
        // Use estimation (scraping disabled for speed)
        const price = estimateCoinPrice(coin, gradeCode);
        estimatedCount++;

        // Insert price guide entry
        await prisma.coinPriceGuide.upsert({
          where: {
            coinReferenceId_gradeCode_priceDate: {
              coinReferenceId: coin.id,
              gradeCode,
              priceDate,
            },
          },
          update: {
            pcgsPrice: price,
          },
          create: {
            coinReferenceId: coin.id,
            gradeCode,
            pcgsPrice: price,
            priceDate,
          },
        });

        coinPrices++;
        totalPrices++;
      }

      console.log(`  ✓ Added ${coinPrices} prices\n`);
    }

    console.log('\n✅ Population completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total coins: ${coins.length}`);
    console.log(`   - Total prices: ${totalPrices}`);
    console.log(`   - Scraped prices: ${scrapedCount}`);
    console.log(`   - Estimated prices: ${estimatedCount}`);
    console.log(`   - Grades per coin: ${Object.keys(GRADE_MULTIPLIERS).length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

populateAllPrices();
