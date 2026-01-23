/**
 * Script to update historical-prices.json with latest prices
 * Run this daily: npm run update-prices
 *
 * This script:
 * 1. Fetches current spot prices from Metal Price API
 * 2. Adds/updates the entry for today in historical-prices.json
 * 3. Also updates the mobile app's historical-prices.json
 */

import fs from 'fs';
import path from 'path';

const WEB_DATA_FILE = path.join(process.cwd(), 'src/data/historical-prices.json');
const MOBILE_DATA_FILE = path.join(process.cwd(), '../bullion-tracker-mobile/src/data/historical-prices.json');

async function fetchCurrentPrices() {
  const apiKey = process.env.METAL_PRICE_API_KEY;

  if (!apiKey) {
    console.error('METAL_PRICE_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('Fetching current metal prices from API...');

  try {
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`
    );

    const data = await response.json();

    if (!data.success || !data.rates) {
      throw new Error('Failed to fetch prices from API');
    }

    const goldPrice = Math.round(1 / data.rates.XAU);
    const silverPrice = Math.round((1 / data.rates.XAG) * 100) / 100;
    const platinumPrice = Math.round(1 / data.rates.XPT);

    console.log('Current prices:');
    console.log(`  Gold: $${goldPrice}/oz`);
    console.log(`  Silver: $${silverPrice}/oz`);
    console.log(`  Platinum: $${platinumPrice}/oz`);

    return { goldPrice, silverPrice, platinumPrice };
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

function updateJsonFile(filePath: string, goldPrice: number, silverPrice: number, platinumPrice: number) {
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${filePath} (file not found)`);
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  // Create new entry for today
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Check if we already have an entry for today
  const existingIndex = data.prices.findIndex((p: any) => p.date === dateStr);

  const newEntry = {
    date: dateStr,
    gold: goldPrice,
    silver: silverPrice,
    platinum: platinumPrice,
  };

  if (existingIndex >= 0) {
    console.log(`  Updating existing entry for ${dateStr}...`);
    data.prices[existingIndex] = newEntry;
  } else {
    console.log(`  Adding new entry for ${dateStr}...`);
    data.prices.push(newEntry);
    // Sort by date
    data.prices.sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  // Update metadata
  data.metadata.lastUpdated = dateStr;

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  ✅ Updated: ${filePath}`);
}

async function updateHistoricalData() {
  try {
    // Get current prices
    const { goldPrice, silverPrice, platinumPrice } = await fetchCurrentPrices();

    console.log('\nUpdating historical price files...');

    // Update web app data
    updateJsonFile(WEB_DATA_FILE, goldPrice, silverPrice, platinumPrice);

    // Update mobile app data
    updateJsonFile(MOBILE_DATA_FILE, goldPrice, silverPrice, platinumPrice);

    console.log('\n✅ Historical prices updated successfully!');
    console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('Error updating historical data:', error);
    process.exit(1);
  }
}

// Run the update
updateHistoricalData();
