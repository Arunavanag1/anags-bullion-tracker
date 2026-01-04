/**
 * Script to scrape PCGS price guide data for all coins in the database
 * Run with: DATABASE_URL="postgresql://..." npx tsx scripts/scrape-pcgs-prices.ts
 */

import * as cheerio from 'cheerio';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL || 'postgresql://arunavanag@localhost:5432/bullion_tracker';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

interface PriceData {
  gradeCode: string;
  price: number | null;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapePCGSPriceGuide(pcgsNumber: number): Promise<PriceData[]> {
  const url = `https://www.pcgs.com/prices/${pcgsNumber}`;

  console.log(`  Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      console.log(`  ⚠️  HTTP ${response.status} - skipping`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const prices: PriceData[] = [];

    // PCGS price guide table structure
    // Look for grade cells and their corresponding price cells
    $('table.price-guide-table tr, table[class*="price"] tr').each((i, row) => {
      const $row = $(row);
      const gradeCell = $row.find('td:first-child, th:first-child').text().trim();
      const priceCell = $row.find('td:nth-child(2), td:nth-child(3)').text().trim();

      // Match common grade patterns (MS65, PR70, AU58, etc.)
      const gradeMatch = gradeCell.match(/^(MS|PR|PF|AU|XF|VF|F|VG|G|AG|FR)\s?(\d{1,2})(\+)?$/i);

      if (gradeMatch && priceCell) {
        const gradeCode = gradeMatch[1].toUpperCase() + gradeMatch[2] + (gradeMatch[3] || '');
        const priceMatch = priceCell.replace(/[$,]/g, '').match(/[\d.]+/);

        if (priceMatch) {
          const price = parseFloat(priceMatch[0]);
          if (!isNaN(price) && price > 0) {
            prices.push({
              gradeCode,
              price,
            });
          }
        }
      }
    });

    // If table parsing didn't work, try JSON-LD data
    if (prices.length === 0) {
      const scriptTags = $('script[type="application/ld+json"]');
      scriptTags.each((i, elem) => {
        try {
          const data = JSON.parse($(elem).html() || '{}');
          if (data.offers && Array.isArray(data.offers)) {
            data.offers.forEach((offer: any) => {
              if (offer.grade && offer.price) {
                prices.push({
                  gradeCode: offer.grade,
                  price: parseFloat(offer.price),
                });
              }
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
    }

    console.log(`  ✓ Found ${prices.length} prices`);
    return prices;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

async function importPriceGuideData() {
  console.log('🚀 Starting PCGS price guide scraper...\n');

  try {
    // Get all coins from database
    const coins = await prisma.coinReference.findMany({
      orderBy: {
        pcgsNumber: 'asc',
      },
    });

    console.log(`📊 Found ${coins.length} coins to process\n`);

    let successCount = 0;
    let errorCount = 0;
    let totalPricesImported = 0;

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      const progress = `[${i + 1}/${coins.length}]`;

      console.log(`${progress} ${coin.fullName} (PCGS# ${coin.pcgsNumber})`);

      try {
        // Scrape prices for this coin
        const prices = await scrapePCGSPriceGuide(coin.pcgsNumber);

        if (prices.length > 0) {
          // Get or create ValidGrade entries and insert price guide data
          const priceDate = new Date();

          for (const priceData of prices) {
            // Ensure grade exists in ValidGrade table
            const grade = await prisma.validGrade.upsert({
              where: {
                gradeCode: priceData.gradeCode,
              },
              update: {},
              create: {
                gradeCode: priceData.gradeCode,
                numericValue: parseInt(priceData.gradeCode.match(/\d+/)?.[0] || '0'),
                gradeCategory: priceData.gradeCode.startsWith('MS') ? 'Mint State' :
                               priceData.gradeCode.startsWith('PR') || priceData.gradeCode.startsWith('PF') ? 'Proof' :
                               priceData.gradeCode.startsWith('AU') ? 'About Uncirculated' :
                               priceData.gradeCode.startsWith('XF') ? 'Extremely Fine' :
                               priceData.gradeCode.startsWith('VF') ? 'Very Fine' :
                               priceData.gradeCode.startsWith('F') ? 'Fine' :
                               priceData.gradeCode.startsWith('VG') ? 'Very Good' :
                               priceData.gradeCode.startsWith('G') ? 'Good' : 'Circulated',
                displayOrder: parseInt(priceData.gradeCode.match(/\d+/)?.[0] || '0'),
              },
            });

            // Insert price guide entry
            await prisma.coinPriceGuide.upsert({
              where: {
                coinReferenceId_gradeCode_priceDate: {
                  coinReferenceId: coin.id,
                  gradeCode: priceData.gradeCode,
                  priceDate: priceDate,
                },
              },
              update: {
                pcgsPrice: priceData.price,
              },
              create: {
                coinReferenceId: coin.id,
                gradeCode: priceData.gradeCode,
                pcgsPrice: priceData.price,
                priceDate: priceDate,
              },
            });
          }

          totalPricesImported += prices.length;
          successCount++;
        } else {
          errorCount++;
        }

        // Rate limiting: wait 2 seconds between requests to be respectful
        if (i < coins.length - 1) {
          await delay(2000);
        }

      } catch (error) {
        console.log(`  ✗ Error processing coin: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }

      console.log(''); // Empty line for readability
    }

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total coins processed: ${coins.length}`);
    console.log(`   - Successfully scraped: ${successCount}`);
    console.log(`   - Failed/skipped: ${errorCount}`);
    console.log(`   - Total prices imported: ${totalPricesImported}`);
    console.log(`   - Average prices per coin: ${(totalPricesImported / successCount).toFixed(1)}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the scraper
importPriceGuideData();
