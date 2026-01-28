import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { SpotPrices } from '../types';

const CACHE_KEY = 'spot_prices_cache_v3'; // v3 - fetch from backend API
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (backend handles longer caching)
const ERROR_CACHE_KEY = 'api_error_timestamp';
const ERROR_RETRY_DELAY = 2 * 60 * 1000; // Retry after 2 minutes on error

interface CachedPrices {
  prices: SpotPrices;
  timestamp: number;
}

/**
 * Fetch current spot prices from backend API
 * Backend handles Metal Price API calls and caching
 */
export async function fetchSpotPrices(_apiKey?: string): Promise<SpotPrices> {
  try {
    // DEBUG: Skip cache to force fresh fetch
    console.log('[PRICES] Skipping cache, forcing fresh fetch');
    // Check cache first (short duration since backend handles main caching)
    // const cached = await getCachedPrices();
    // if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    //   return cached.prices;
    // }

    // DEBUG: Skip error delay check
    // Check if we recently had an API error
    // const lastError = await getLastErrorTimestamp();
    // if (lastError && Date.now() - lastError < ERROR_RETRY_DELAY) {
    //   if (cached) {
    //     return cached.prices;
    //   }
    //   return getFallbackPrices();
    // }

    // Fetch from backend API (handles Metal Price API and caching)
    const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'https://bullion-tracker-plum.vercel.app';
    console.log('[PRICES] Fetching from:', `${apiUrl}/api/prices`);
    const response = await fetch(`${apiUrl}/api/prices`);
    console.log('[PRICES] Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Backend API returned unsuccessful response');
    }

    const prices: SpotPrices = {
      gold: Math.round(data.data.gold.pricePerOz),
      silver: Math.round(data.data.silver.pricePerOz * 100) / 100,
      platinum: Math.round(data.data.platinum.pricePerOz),
      lastUpdated: data.data.gold.lastUpdated,
    };

    // Cache the results and clear error timestamp
    await cachePrices(prices);
    await clearErrorTimestamp();

    return prices;
  } catch (error) {
    console.error('Failed to fetch spot prices:', error);
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
