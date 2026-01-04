import { SpotPrice, SpotPricesResponse } from '@/types';

const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours (twice daily updates)

interface MetalPriceAPIResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: {
    XAU?: number; // Gold
    XAG?: number; // Silver
    XPT?: number; // Platinum
  };
}

interface CachedPrices {
  prices: SpotPricesResponse;
  timestamp: number;
  previousPrices?: SpotPricesResponse;
}

let priceCache: CachedPrices | null = null;

/**
 * Fetch current spot prices with twice-daily caching
 * Only fetches from API if cache is older than 12 hours
 */
export async function fetchSpotPrices(): Promise<SpotPricesResponse> {
  const apiKey = process.env.METAL_PRICE_API_KEY;

  // Check if cache is still valid (less than 12 hours old)
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION_MS) {
    return priceCache.prices;
  }

  // Try to fetch fresh prices from API
  if (apiKey) {
    try {
      const freshPrices = await fetchFromAPI(apiKey);

      // Update cache with new prices
      priceCache = {
        prices: freshPrices,
        timestamp: Date.now(),
        previousPrices: priceCache?.prices,
      };

      // Save to database for historical tracking
      try {
        await savePriceSnapshot(freshPrices);
      } catch (dbError) {
        console.error('Failed to save price snapshot to database:', dbError);
        // Continue even if DB save fails
      }

      return freshPrices;
    } catch (error) {
      console.error('Error fetching from Metal Price API:', error);

      // Fall back to cached prices if available
      if (priceCache) {
        console.warn('Using cached prices due to API error');
        return priceCache.prices;
      }

      // Fall back to mock prices as last resort
      return getMockSpotPrices();
    }
  }

  // No API key - try cache, then database, then mock
  if (priceCache) {
    return priceCache.prices;
  }

  // Try to get last saved prices from database
  try {
    const dbPrices = await getLastSavedPrices();
    if (dbPrices) {
      priceCache = {
        prices: dbPrices,
        timestamp: Date.now(),
      };
      return dbPrices;
    }
  } catch (error) {
    console.error('Error fetching from database:', error);
  }

  // Ultimate fallback: mock prices
  return getMockSpotPrices();
}

/**
 * Fetch prices from Metal Price API
 */
async function fetchFromAPI(apiKey: string): Promise<SpotPricesResponse> {
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`;

  const response = await fetch(url, {
    next: { revalidate: CACHE_DURATION_MS / 1000 }, // Next.js cache config
  });

  if (!response.ok) {
    throw new Error(`Metal Price API returned ${response.status}: ${response.statusText}`);
  }

  const data: MetalPriceAPIResponse = await response.json();

  if (!data.success || !data.rates) {
    throw new Error('Invalid response from Metal Price API');
  }

  // Convert API format to our internal format
  // Metal Price API returns rates as "how much metal per USD"
  // We need to invert to get "USD per ounce"
  const now = new Date();

  if (!data.rates.XAU || !data.rates.XAG || !data.rates.XPT) {
    throw new Error('Missing metal rates in API response');
  }

  const goldPrice = 1 / data.rates.XAU;
  const silverPrice = 1 / data.rates.XAG;
  const platinumPrice = 1 / data.rates.XPT;

  // Calculate 24h change (if we have previous prices)
  const goldChange24h = priceCache?.prices.gold.pricePerOz
    ? goldPrice - priceCache.prices.gold.pricePerOz
    : 0;
  const silverChange24h = priceCache?.prices.silver.pricePerOz
    ? silverPrice - priceCache.prices.silver.pricePerOz
    : 0;
  const platinumChange24h = priceCache?.prices.platinum.pricePerOz
    ? platinumPrice - priceCache.prices.platinum.pricePerOz
    : 0;

  const gold: SpotPrice = {
    metal: 'gold',
    pricePerOz: goldPrice,
    change24h: goldChange24h,
    changePercent24h: priceCache?.prices.gold.pricePerOz
      ? (goldChange24h / priceCache.prices.gold.pricePerOz) * 100
      : 0,
    lastUpdated: now,
  };

  const silver: SpotPrice = {
    metal: 'silver',
    pricePerOz: silverPrice,
    change24h: silverChange24h,
    changePercent24h: priceCache?.prices.silver.pricePerOz
      ? (silverChange24h / priceCache.prices.silver.pricePerOz) * 100
      : 0,
    lastUpdated: now,
  };

  const platinum: SpotPrice = {
    metal: 'platinum',
    pricePerOz: platinumPrice,
    change24h: platinumChange24h,
    changePercent24h: priceCache?.prices.platinum.pricePerOz
      ? (platinumChange24h / priceCache.prices.platinum.pricePerOz) * 100
      : 0,
    lastUpdated: now,
  };

  return { gold, silver, platinum };
}

/**
 * Get last saved prices from database
 */
async function getLastSavedPrices(): Promise<SpotPricesResponse | null> {
  const { prisma } = await import('./db');

  const [goldPrice, silverPrice, platinumPrice] = await Promise.all([
    prisma.priceHistory.findFirst({
      where: { metal: 'gold' },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.priceHistory.findFirst({
      where: { metal: 'silver' },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.priceHistory.findFirst({
      where: { metal: 'platinum' },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  if (!goldPrice || !silverPrice || !platinumPrice) {
    return null;
  }

  // Get prices from 24 hours ago to calculate change
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [goldYesterday, silverYesterday, platinumYesterday] = await Promise.all([
    prisma.priceHistory.findFirst({
      where: {
        metal: 'gold',
        timestamp: { lte: yesterday }
      },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.priceHistory.findFirst({
      where: {
        metal: 'silver',
        timestamp: { lte: yesterday }
      },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.priceHistory.findFirst({
      where: {
        metal: 'platinum',
        timestamp: { lte: yesterday }
      },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  // Calculate changes
  const goldChange = goldYesterday ? goldPrice.priceOz - goldYesterday.priceOz : 0;
  const silverChange = silverYesterday ? silverPrice.priceOz - silverYesterday.priceOz : 0;
  const platinumChange = platinumYesterday ? platinumPrice.priceOz - platinumYesterday.priceOz : 0;

  const gold: SpotPrice = {
    metal: 'gold',
    pricePerOz: goldPrice.priceOz,
    change24h: goldChange,
    changePercent24h: goldYesterday ? (goldChange / goldYesterday.priceOz) * 100 : 0,
    lastUpdated: goldPrice.timestamp,
  };

  const silver: SpotPrice = {
    metal: 'silver',
    pricePerOz: silverPrice.priceOz,
    change24h: silverChange,
    changePercent24h: silverYesterday ? (silverChange / silverYesterday.priceOz) * 100 : 0,
    lastUpdated: silverPrice.timestamp,
  };

  const platinum: SpotPrice = {
    metal: 'platinum',
    pricePerOz: platinumPrice.priceOz,
    change24h: platinumChange,
    changePercent24h: platinumYesterday ? (platinumChange / platinumYesterday.priceOz) * 100 : 0,
    lastUpdated: platinumPrice.timestamp,
  };

  return { gold, silver, platinum };
}

/**
 * Generate mock spot prices with realistic fluctuations
 */
function getMockSpotPrices(): SpotPricesResponse {
  const now = new Date();

  // Base prices with small random variations
  const goldBase = 2650;
  const silverBase = 31.85;
  const platinumBase = 982;

  const goldVariation = (Math.random() - 0.5) * 20;
  const silverVariation = (Math.random() - 0.5) * 0.5;
  const platinumVariation = (Math.random() - 0.5) * 10;

  const goldPrice = goldBase + goldVariation;
  const silverPrice = silverBase + silverVariation;
  const platinumPrice = platinumBase + platinumVariation;

  const gold: SpotPrice = {
    metal: 'gold',
    pricePerOz: goldPrice,
    change24h: goldVariation,
    changePercent24h: (goldVariation / goldBase) * 100,
    lastUpdated: now,
  };

  const silver: SpotPrice = {
    metal: 'silver',
    pricePerOz: silverPrice,
    change24h: silverVariation,
    changePercent24h: (silverVariation / silverBase) * 100,
    lastUpdated: now,
  };

  const platinum: SpotPrice = {
    metal: 'platinum',
    pricePerOz: platinumPrice,
    change24h: platinumVariation,
    changePercent24h: (platinumVariation / platinumBase) * 100,
    lastUpdated: now,
  };

  return { gold, silver, platinum };
}

/**
 * Get realistic historical price estimate based on date
 * Free API tier only supports last 30 days, so we need estimates for older data
 */
function getHistoricalPriceEstimate(date: Date): { gold: number; silver: number; platinum: number } {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Approximate historical prices based on known market trends
  // These are rough estimates - real historical tracking will build over time
  if (year === 2025) {
    return { gold: 2700, silver: 32, platinum: 980 };
  } else if (year === 2024) {
    if (month >= 6) {
      return { gold: 2400, silver: 29, platinum: 950 };
    } else {
      return { gold: 2050, silver: 24, platinum: 920 };
    }
  } else if (year === 2023) {
    return { gold: 1950, silver: 23.5, platinum: 980 };
  } else if (year === 2022) {
    return { gold: 1800, silver: 21, platinum: 1000 };
  } else {
    // Default older estimates
    return { gold: 1700, silver: 20, platinum: 950 };
  }
}

/**
 * Fetch historical price data from Metal Price API for all metals
 * Free tier: only last 30 days, one currency at a time
 * Older data: use reasonable historical estimates
 */
export async function fetchHistoricalPricesFromAPI(
  startDate: Date,
  endDate: Date
): Promise<Record<string, Array<{ timestamp: Date; gold: number; silver: number; platinum: number }>>> {
  const apiKey = process.env.METAL_PRICE_API_KEY;

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const historicalData: Array<{ timestamp: Date; gold: number; silver: number; platinum: number }> = [];

  // Split request into API-available period (last 30 days) and estimation period
  const apiStartDate = startDate > thirtyDaysAgo ? startDate : thirtyDaysAgo;
  const needEstimates = startDate < thirtyDaysAgo;

  try {
    // Fetch recent data from API (last 30 days)
    if (apiStartDate <= endDate) {
      const start = formatDate(apiStartDate);
      const end = formatDate(endDate);

      console.log(`Fetching API data from ${start} to ${end}`);

      // Fetch metals individually and handle failures gracefully
      const goldData = await fetchMetalTimeframe(apiKey, start, end, 'XAU').catch((err) => {
        console.warn(`Failed to fetch gold: ${err.message}`);
        return {};
      });

      const silverData = await fetchMetalTimeframe(apiKey, start, end, 'XAG').catch((err) => {
        console.warn(`Failed to fetch silver: ${err.message}`);
        return {};
      });

      const platinumData = await fetchMetalTimeframe(apiKey, start, end, 'XPT').catch((err) => {
        console.warn(`Failed to fetch platinum: ${err.message}`);
        return {};
      });

      // If all three failed, throw error to use fallback
      if (Object.keys(goldData).length === 0 &&
          Object.keys(silverData).length === 0 &&
          Object.keys(platinumData).length === 0) {
        throw new Error('All metal API calls failed - using fallback estimates');
      }

      // Combine API data by date
      const dateMap = new Map<string, { gold?: number; silver?: number; platinum?: number }>();

      for (const [dateStr, rate] of Object.entries(goldData)) {
        dateMap.set(dateStr, { gold: 1 / (rate as number) });
      }

      for (const [dateStr, rate] of Object.entries(silverData)) {
        const existing = dateMap.get(dateStr) || {};
        dateMap.set(dateStr, { ...existing, silver: 1 / (rate as number) });
      }

      for (const [dateStr, rate] of Object.entries(platinumData)) {
        const existing = dateMap.get(dateStr) || {};
        dateMap.set(dateStr, { ...existing, platinum: 1 / (rate as number) });
      }

      for (const [dateStr, prices] of dateMap.entries()) {
        const date = new Date(dateStr);
        const estimate = getHistoricalPriceEstimate(date);

        // Use API data if available, otherwise use estimate
        historicalData.push({
          timestamp: date,
          gold: prices.gold || estimate.gold,
          silver: prices.silver || estimate.silver,
          platinum: prices.platinum || estimate.platinum,
        });
      }

      console.log(`Fetched ${historicalData.length} API data points`);
    }

    // Generate estimates for older period (beyond 30 days)
    if (needEstimates) {
      const estimateEndDate = new Date(Math.min(thirtyDaysAgo.getTime(), endDate.getTime()));
      const dayMs = 24 * 60 * 60 * 1000;

      console.log(`Generating estimates from ${formatDate(startDate)} to ${formatDate(estimateEndDate)}`);

      for (let time = startDate.getTime(); time <= estimateEndDate.getTime(); time += dayMs) {
        const date = new Date(time);
        const estimate = getHistoricalPriceEstimate(date);

        // Add small daily variation (±2%)
        const variation = (Math.random() - 0.5) * 0.04;
        historicalData.push({
          timestamp: date,
          gold: estimate.gold * (1 + variation),
          silver: estimate.silver * (1 + variation),
          platinum: estimate.platinum * (1 + variation),
        });
      }

      console.log(`Generated ${historicalData.length - (historicalData.length - Math.ceil((estimateEndDate.getTime() - startDate.getTime()) / dayMs))} estimate points`);
    }

    // Sort by date
    historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (historicalData.length > 0) {
      console.log('Sample data:', {
        date: historicalData[0].timestamp.toISOString().split('T')[0],
        gold: historicalData[0].gold.toFixed(2),
        silver: historicalData[0].silver.toFixed(2),
      });
    }

    return { data: historicalData };
  } catch (error) {
    console.error('Error fetching historical prices from API:', error);
    throw error;
  }
}

/**
 * Fetch timeframe data for a single metal
 */
async function fetchMetalTimeframe(
  apiKey: string,
  startDate: string,
  endDate: string,
  currency: 'XAU' | 'XAG' | 'XPT'
): Promise<Record<string, number>> {
  const url = `https://api.metalpriceapi.com/v1/timeframe?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}&base=USD&currencies=${currency}`;

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Metal Price API error for ${currency}:`, errorText);
    throw new Error(`Metal Price API returned ${response.status} for ${currency}`);
  }

  const data = await response.json();

  // Log the actual response to debug
  if (!data.success) {
    console.error(`API returned success=false for ${currency}:`, JSON.stringify(data));
    throw new Error(`API error for ${currency}: ${data.error?.message || 'Unknown error'}`);
  }

  if (!data.rates) {
    console.error(`No rates in response for ${currency}:`, JSON.stringify(data));
    throw new Error(`No rates returned for ${currency}`);
  }

  // Extract the currency rates from nested structure
  const rates: Record<string, number> = {};
  for (const [dateStr, rateObj] of Object.entries(data.rates)) {
    const rateData = rateObj as Record<string, number>;
    if (rateData[currency]) {
      rates[dateStr] = rateData[currency];
    }
  }

  if (Object.keys(rates).length === 0) {
    console.warn(`No ${currency} rates found in response`);
  }

  return rates;
}

/**
 * Get historical prices for a specific metal and time range
 * Tries API first, then database, then fallback to mock data
 */
export async function fetchHistoricalPrices(
  metal: 'gold' | 'silver' | 'platinum',
  startDate: Date,
  endDate: Date
): Promise<Array<{ timestamp: Date; price: number }>> {
  // Try to fetch from API first
  try {
    const historicalData = await fetchHistoricalPricesFromAPI(startDate, endDate);
    return historicalData.data.map((point) => ({
      timestamp: point.timestamp,
      price: point[metal],
    }));
  } catch (apiError) {
    console.warn('API fetch failed, trying database:', apiError);
  }

  // Fallback to database
  const { prisma } = await import('./db');

  try {
    const prices = await prisma.priceHistory.findMany({
      where: {
        metal,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (prices.length > 0) {
      return prices.map((p) => ({
        timestamp: p.timestamp,
        price: p.priceOz,
      }));
    }
  } catch (error) {
    console.error('Error fetching historical prices from database:', error);
  }

  // Ultimate fallback: generate dummy historical data
  const prices: Array<{ timestamp: Date; price: number }> = [];
  const basePrices = { gold: 2650, silver: 31.85, platinum: 982 };
  const basePrice = basePrices[metal];

  const start = startDate.getTime();
  const end = endDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let time = start; time <= end; time += dayMs) {
    const variance = (Math.random() - 0.5) * (basePrice * 0.1);
    prices.push({
      timestamp: new Date(time),
      price: basePrice + variance,
    });
  }

  return prices;
}

/**
 * Save price snapshot to database for historical tracking
 */
export async function savePriceSnapshot(
  prices: SpotPricesResponse
): Promise<void> {
  const { prisma } = await import('./db');

  await Promise.all([
    prisma.priceHistory.create({
      data: {
        metal: 'gold',
        priceOz: prices.gold.pricePerOz,
        timestamp: prices.gold.lastUpdated,
      },
    }),
    prisma.priceHistory.create({
      data: {
        metal: 'silver',
        priceOz: prices.silver.pricePerOz,
        timestamp: prices.silver.lastUpdated,
      },
    }),
    prisma.priceHistory.create({
      data: {
        metal: 'platinum',
        priceOz: prices.platinum.pricePerOz,
        timestamp: prices.platinum.lastUpdated,
      },
    }),
  ]);
}

/**
 * Force refresh prices (bypasses cache)
 * Useful for manual refresh buttons
 */
export async function forceRefreshPrices(): Promise<SpotPricesResponse> {
  priceCache = null;
  return fetchSpotPrices();
}
