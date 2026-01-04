import historicalPricesData from '@/data/historical-prices.json';

export interface HistoricalPrice {
  date: string;
  gold: number;
  silver: number;
  platinum: number;
}

export interface HistoricalPriceData {
  metadata: {
    description: string;
    source: string;
    lastUpdated: string;
    unit: string;
  };
  prices: HistoricalPrice[];
}

/**
 * Get historical prices from our curated database
 * This data is manually updated weekly and contains real market prices
 */
export function getHistoricalPrices(): HistoricalPriceData {
  return historicalPricesData as HistoricalPriceData;
}

/**
 * Get historical prices for a specific date range
 */
export function getHistoricalPricesInRange(
  startDate: Date,
  endDate: Date
): HistoricalPrice[] {
  const data = getHistoricalPrices();

  return data.prices.filter((price) => {
    const priceDate = new Date(price.date);
    return priceDate >= startDate && priceDate <= endDate;
  });
}

/**
 * Get the nearest historical price for a specific date
 */
export function getNearestHistoricalPrice(date: Date): HistoricalPrice | null {
  const data = getHistoricalPrices();

  let nearest: HistoricalPrice | null = null;
  let minDiff = Infinity;

  for (const price of data.prices) {
    const priceDate = new Date(price.date);
    const diff = Math.abs(priceDate.getTime() - date.getTime());

    if (diff < minDiff) {
      minDiff = diff;
      nearest = price;
    }
  }

  return nearest;
}

/**
 * Interpolate prices for dates between known data points
 */
export function interpolatePrice(
  date: Date,
  before: HistoricalPrice,
  after: HistoricalPrice
): { gold: number; silver: number; platinum: number } {
  const beforeDate = new Date(before.date).getTime();
  const afterDate = new Date(after.date).getTime();
  const targetDate = date.getTime();

  // Linear interpolation
  const ratio = (targetDate - beforeDate) / (afterDate - beforeDate);

  return {
    gold: before.gold + (after.gold - before.gold) * ratio,
    silver: before.silver + (after.silver - before.silver) * ratio,
    platinum: before.platinum + (after.platinum - before.platinum) * ratio,
  };
}

/**
 * Get price for any date with interpolation
 */
export function getPriceForDate(date: Date): { gold: number; silver: number; platinum: number } {
  const data = getHistoricalPrices();
  const targetTime = date.getTime();

  // Find the data points before and after the target date
  let before: HistoricalPrice | null = null;
  let after: HistoricalPrice | null = null;

  for (let i = 0; i < data.prices.length; i++) {
    const priceDate = new Date(data.prices[i].date).getTime();

    if (priceDate <= targetTime) {
      before = data.prices[i];
    }

    if (priceDate >= targetTime && !after) {
      after = data.prices[i];
      break;
    }
  }

  // If we have exact match
  if (before && new Date(before.date).getTime() === targetTime) {
    return { gold: before.gold, silver: before.silver, platinum: before.platinum };
  }

  // If we have before and after, interpolate
  if (before && after) {
    return interpolatePrice(date, before, after);
  }

  // If only before (date is after our last data point), use the last known price
  if (before) {
    return { gold: before.gold, silver: before.silver, platinum: before.platinum };
  }

  // If only after (date is before our first data point), use the first known price
  if (after) {
    return { gold: after.gold, silver: after.silver, platinum: after.platinum };
  }

  // Fallback (shouldn't happen)
  return { gold: 2000, silver: 25, platinum: 950 };
}

/**
 * Generate daily price points for a date range using our historical database
 */
export function generateDailyPrices(
  startDate: Date,
  endDate: Date,
  intervalDays: number = 1
): Array<{ timestamp: Date; gold: number; silver: number; platinum: number }> {
  const prices: Array<{ timestamp: Date; gold: number; silver: number; platinum: number }> = [];
  const dayMs = 24 * 60 * 60 * 1000;

  for (let time = startDate.getTime(); time <= endDate.getTime(); time += intervalDays * dayMs) {
    const date = new Date(time);
    const price = getPriceForDate(date);

    prices.push({
      timestamp: date,
      ...price,
    });
  }

  return prices;
}
