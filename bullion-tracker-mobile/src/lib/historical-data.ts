import historicalPricesData from '../data/historical-prices.json';
import type { HistoricalPriceData, HistoricalPriceEntry } from '../types';

export function getHistoricalPrices(): HistoricalPriceData {
  return historicalPricesData as HistoricalPriceData;
}

/**
 * Get prices for a specific date using linear interpolation between known data points
 */
export function getPriceForDate(date: Date): { gold: number; silver: number; platinum: number } {
  const data = getHistoricalPrices();
  const targetTime = date.getTime();

  // Find the two closest data points
  let before: HistoricalPriceEntry | null = null;
  let after: HistoricalPriceEntry | null = null;

  for (let i = 0; i < data.prices.length; i++) {
    const entryDate = new Date(data.prices[i].date);
    const entryTime = entryDate.getTime();

    if (entryTime <= targetTime) {
      before = data.prices[i];
    }

    if (entryTime >= targetTime && !after) {
      after = data.prices[i];
      break;
    }
  }

  // If exact match or only one data point available
  if (before && after && new Date(before.date).getTime() === targetTime) {
    return { gold: before.gold, silver: before.silver, platinum: before.platinum };
  }

  if (!before) {
    // Date is before our data range - use first entry
    return { gold: data.prices[0].gold, silver: data.prices[0].silver, platinum: data.prices[0].platinum };
  }

  if (!after) {
    // Date is after our data range - use last entry
    const last = data.prices[data.prices.length - 1];
    return { gold: last.gold, silver: last.silver, platinum: last.platinum };
  }

  // Linear interpolation between the two points
  const beforeTime = new Date(before.date).getTime();
  const afterTime = new Date(after.date).getTime();
  const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);

  return {
    gold: before.gold + (after.gold - before.gold) * ratio,
    silver: before.silver + (after.silver - before.silver) * ratio,
    platinum: before.platinum + (after.platinum - before.platinum) * ratio,
  };
}

/**
 * Generate an array of daily price points for charting
 */
export function generateDailyPrices(
  startDate: Date,
  endDate: Date,
  intervalDays: number = 1
): Array<{ timestamp: Date; gold: number; silver: number; platinum: number }> {
  const result: Array<{ timestamp: Date; gold: number; silver: number; platinum: number }> = [];

  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (currentDate <= end) {
    const prices = getPriceForDate(currentDate);
    result.push({
      timestamp: new Date(currentDate),
      ...prices,
    });

    // Advance by interval days
    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  return result;
}
