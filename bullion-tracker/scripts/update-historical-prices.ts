/**
 * Script to update historical-prices.json with latest prices
 * Run this weekly: npm run update-prices
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/data/historical-prices.json');

async function fetchCurrentPrices() {
  const apiKey = process.env.METAL_PRICE_API_KEY;

  if (!apiKey) {
    console.error('METAL_PRICE_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('Fetching current metal prices from API...');

  try {
    // Fetch current prices for each metal
    const [goldRes, silverRes, platinumRes] = await Promise.all([
      fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`),
      fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAG`),
      fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XPT`),
    ]);

    const goldData = await goldRes.json();
    const silverData = await silverRes.json();
    const platinumData = await platinumRes.json();

    if (!goldData.success || !silverData.success || !platinumData.success) {
      throw new Error('Failed to fetch prices from API');
    }

    const goldPrice = Math.round(1 / goldData.rates.XAU);
    const silverPrice = Math.round((1 / silverData.rates.XAG) * 100) / 100;
    const platinumPrice = Math.round(1 / platinumData.rates.XPT);

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

async function updateHistoricalData() {
  try {
    // Read existing data
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(rawData);

    // Get current prices
    const { goldPrice, silverPrice, platinumPrice } = await fetchCurrentPrices();

    // Create new entry for the first day of current month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateStr = firstOfMonth.toISOString().split('T')[0];

    // Check if we already have an entry for this month
    const existingIndex = data.prices.findIndex((p: any) => p.date === dateStr);

    const newEntry = {
      date: dateStr,
      gold: goldPrice,
      silver: silverPrice,
      platinum: platinumPrice,
    };

    if (existingIndex >= 0) {
      console.log(`\nUpdating existing entry for ${dateStr}...`);
      data.prices[existingIndex] = newEntry;
    } else {
      console.log(`\nAdding new entry for ${dateStr}...`);
      data.prices.push(newEntry);
      // Sort by date
      data.prices.sort((a: any, b: any) => a.date.localeCompare(b.date));
    }

    // Update metadata
    data.metadata.lastUpdated = new Date().toISOString().split('T')[0];

    // Write back to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

    console.log('\n✅ Historical prices updated successfully!');
    console.log(`📁 File: ${DATA_FILE}`);
    console.log(`📅 Last updated: ${data.metadata.lastUpdated}`);
    console.log(`📊 Total data points: ${data.prices.length}`);
  } catch (error) {
    console.error('Error updating historical data:', error);
    process.exit(1);
  }
}

// Run the update
updateHistoricalData();
