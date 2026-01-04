import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SpotPrices } from '../types';

const CACHE_KEY = 'spot_prices_cache_v2'; // v2 to invalidate old cache with wrong fallback
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const ERROR_CACHE_KEY = 'api_error_timestamp';
const ERROR_RETRY_DELAY = 5 * 60 * 1000; // Don't retry API for 5 minutes after error

interface CachedPrices {
  prices: SpotPrices;
  timestamp: number;
}

/**
 * Fetch current spot prices from Metal Price API
 */
export async function fetchSpotPrices(apiKey: string): Promise<SpotPrices> {
  try {
    // Check cache first
    const cached = await getCachedPrices();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.prices;
    }

    // Check if we recently had an API error
    const lastError = await getLastErrorTimestamp();
    if (lastError && Date.now() - lastError < ERROR_RETRY_DELAY) {
      // Use cached or fallback without trying API
      if (cached) {
        return cached.prices;
      }
      return getFallbackPrices();
    }

    // If no API key, skip API call and use fallback
    if (!apiKey || apiKey.trim() === '') {
      console.log('No API key configured - using fallback prices');
      return getFallbackPrices();
    }

    // Fetch all metals in one API call (better for rate limits)
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error('API returned unsuccessful response');
    }

    const prices: SpotPrices = {
      gold: Math.round(1 / data.rates.XAU),
      silver: Math.round((1 / data.rates.XAG) * 100) / 100,
      platinum: Math.round(1 / data.rates.XPT),
      lastUpdated: new Date().toISOString(),
    };

    // Cache the results and clear error timestamp
    await cachePrices(prices);
    await clearErrorTimestamp();

    return prices;
  } catch (error) {
    // Save error timestamp to avoid spamming API
    await saveErrorTimestamp();

    // Try to return cached prices even if expired
    const cached = await getCachedPrices();
    if (cached) {
      return cached.prices;
    }

    // Fallback to reasonable estimates if no cache available
    return getFallbackPrices();
  }
}

function getFallbackPrices(): SpotPrices {
  return {
    gold: 4500,
    silver: 78,
    platinum: 2400,
    lastUpdated: new Date().toISOString(),
  };
}

async function getCachedPrices(): Promise<CachedPrices | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

async function cachePrices(prices: SpotPrices): Promise<void> {
  try {
    const cached: CachedPrices = {
      prices,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache prices:', error);
  }
}

async function getLastErrorTimestamp(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(ERROR_CACHE_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
}

async function saveErrorTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem(ERROR_CACHE_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save error timestamp:', error);
  }
}

async function clearErrorTimestamp(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ERROR_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear error timestamp:', error);
  }
}
