/**
 * Script to populate the PriceHistory table with historical spot prices
 * from the historical-prices.json file.
 *
 * Run once to backfill the database: npx tsx scripts/populate-spot-price-history.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

interface HistoricalPrice {
  date: string;
  gold: number;
  silver: number;
  platinum: number;
}

const dataFilePath = path.join(__dirname, '../src/data/historical-prices.json');
const historicalPricesData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

async function populatePriceHistory() {
  console.log('🔄 Populating PriceHistory table with historical spot prices...\n');

  const prices = historicalPricesData.prices as HistoricalPrice[];
  let inserted = 0;
  let skipped = 0;

  for (const price of prices) {
    const timestamp = new Date(price.date);
    timestamp.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    try {
      // Check if entries already exist for this date
      const existingGold = await prisma.priceHistory.findFirst({
        where: {
          metal: 'gold',
          timestamp: {
            gte: new Date(price.date),
            lt: new Date(new Date(price.date).getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingGold) {
        skipped++;
        continue;
      }

      // Insert prices for all three metals
      await prisma.$transaction([
        prisma.priceHistory.create({
          data: {
            metal: 'gold',
            priceOz: price.gold,
            timestamp,
          },
        }),
        prisma.priceHistory.create({
          data: {
            metal: 'silver',
            priceOz: price.silver,
            timestamp,
          },
        }),
        prisma.priceHistory.create({
          data: {
            metal: 'platinum',
            priceOz: price.platinum,
            timestamp,
          },
        }),
      ]);

      inserted++;

      if (inserted % 50 === 0) {
        console.log(`  Inserted ${inserted} date entries...`);
      }
    } catch (error) {
      console.error(`  Error inserting ${price.date}:`, error);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Inserted: ${inserted} date entries (${inserted * 3} price records)`);
  console.log(`   Skipped: ${skipped} (already existed)`);
}

async function main() {
  try {
    await populatePriceHistory();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
