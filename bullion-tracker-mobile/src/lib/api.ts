import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';
import Constants from 'expo-constants';
import type { CoinReference, ValidGrade, PriceGuideData, CollectionSummary, ItemCategory, GradingService, ProblemType, BookValueType, ValueHistoryEntry, ValuationBreakdown } from '../types';

// Fuse.js search result interface
interface FuseResult<T> {
  item: T;
  refIndex: number;
  score?: number;
}

// Image response from API can be string URL or object with url property
type ImageResponse = string | { url: string };

// Helper to transform image array from API response
function transformImages(images: ImageResponse[] | undefined): string[] {
  if (!images) return [];
  return images.map((img: ImageResponse) => typeof img === 'string' ? img : img.url);
}

// Get API URL from environment with development fallback
function getApiUrl(): string {
  const envUrl = Constants.expoConfig?.extra?.apiUrl;
  if (envUrl) {
    return envUrl;
  }
  // Development fallback - warn in console
  if (__DEV__) {
    console.warn('API_URL not configured in app.json extra.apiUrl, using localhost:3001');
  }
  return 'http://localhost:3001';
}

export const API_URL = getApiUrl();

const TOKEN_KEY = 'auth_token';

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ===== COLLECTION ITEM INTERFACE =====

export interface CollectionItem {
  id: string;
  userId: string;
  category: ItemCategory;

  // Common fields
  purchaseDate: string;
  purchasePrice?: number;
  notes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;

  // Bullion fields
  type?: 'itemized' | 'bulk';
  title?: string;
  metal?: string;
  quantity?: number;
  weightOz?: number;
  bookValueType?: BookValueType;
  customBookValue?: number;
  premiumPercent?: number;
  spotPriceAtCreation?: number;

  // Numismatic fields
  coinReferenceId?: string;
  coinReference?: CoinReference;
  grade?: string;
  gradingService?: GradingService;
  certificationNumber?: string;
  isGradeEstimated?: boolean;
  isProblemCoin?: boolean;
  problemType?: ProblemType;
  numismaticValue?: number;
}

// ===== COIN SEARCH =====

/**
 * Search coin references by query string
 * Caches results for offline access
 */
export async function searchCoins(query: string): Promise<CoinReference[]> {
  try {
    const response = await makeRequest(`/api/coins/search?q=${encodeURIComponent(query)}&limit=10`);

    if (!response.ok) {
      throw new Error('Failed to search coins');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('API search failed, trying cache:', error);
    // Fallback to cached results if offline
    const cached = await getCachedCoins();
    if (cached) {
      return fuzzySearchCoins(cached, query);
    }
    throw error;
  }
}

/**
 * Get all coins and cache locally
 * Call on app startup for offline capability
 */
export async function syncCoinsCache(): Promise<void> {
  try {
    const response = await makeRequest('/api/coins/search?q=&limit=1000');

    if (!response.ok) {
      console.warn('Failed to sync coins cache');
      return;
    }

    const data = await response.json();
    const coins = data.data || [];

    await AsyncStorage.setItem('coins_cache', JSON.stringify(coins));
    await AsyncStorage.setItem('coins_cache_timestamp', Date.now().toString());

    console.log(`Synced ${coins.length} coins to cache`);
  } catch (error) {
    console.error('Failed to sync coins cache:', error);
  }
}

async function getCachedCoins(): Promise<CoinReference[] | null> {
  try {
    const cached = await AsyncStorage.getItem('coins_cache');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function fuzzySearchCoins(coins: CoinReference[], query: string): CoinReference[] {
  const fuse = new Fuse(coins, {
    keys: ['fullName', 'series', 'year', 'pcgsNumber'],
    threshold: 0.3,
  });
  return fuse.search(query).map((result: FuseResult<CoinReference>) => result.item).slice(0, 10);
}

// ===== PRICE GUIDE =====

/**
 * Fetch price guide data for coin + grade
 * Caches results for 1 hour
 */
export async function getPriceGuide(
  coinReferenceId: string,
  grade: string
): Promise<PriceGuideData | null> {
  const cacheKey = `price_${coinReferenceId}_${grade}`;

  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < 3600000) {  // 1 hour
        return data;
      }
    }

    // Fetch from API
    const response = await makeRequest(
      `/api/coins/price-guide?coinReferenceId=${encodeURIComponent(coinReferenceId)}&grade=${encodeURIComponent(grade)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch price guide');
    }

    const json = await response.json();
    const data = json.data;

    // Cache result
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));

    return data;
  } catch (error) {
    console.error('Failed to fetch price guide:', error);

    // Return stale cache if available
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, isStale: true };
    }

    return null;
  }
}

// ===== GRADES =====

/**
 * Get all valid grades
 * Caches indefinitely (rarely changes)
 */
export async function getGrades(): Promise<ValidGrade[]> {
  const cacheKey = 'grades_cache';

  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from API
    const response = await makeRequest('/api/grades');

    if (!response.ok) {
      throw new Error('Failed to fetch grades');
    }

    const data = await response.json();
    const grades = data.data || [];

    // Cache indefinitely
    await AsyncStorage.setItem(cacheKey, JSON.stringify(grades));

    return grades;
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return [];
  }
}

// ===== COLLECTION SUMMARY =====

/**
 * Get collection summary with category breakdown
 */
export async function getCollectionSummary(): Promise<CollectionSummary> {
  try {
    const response = await makeRequest('/api/collection/summary');

    if (!response.ok) {
      throw new Error('Failed to fetch collection summary');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch collection summary:', error);
    // Return default summary on error
    return {
      totalValue: 0,
      bullionValue: 0,
      numismaticValue: 0,
      totalItems: 0,
      bullionItems: 0,
      numismaticItems: 0,
      byMetal: {},
    };
  }
}

// ===== CACHE MANAGEMENT =====

/**
 * Clear old price caches (run on app start)
 */
export async function clearOldPriceCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const priceKeys = keys.filter(k => k.startsWith('price_'));

    for (const key of priceKeys) {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        const { timestamp } = JSON.parse(item);
        const age = Date.now() - timestamp;
        if (age > 86400000) {  // 24 hours
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear old caches:', error);
  }
}

// ===== COLLECTION API (UPDATED) =====

export const api = {
  // Collection Items
  async getCollectionItems(): Promise<CollectionItem[]> {
    const response = await makeRequest('/api/collection');

    if (!response.ok) {
      throw new Error('Failed to fetch collection items');
    }

    const data = await response.json();

    // Transform API response to match mobile app format
    return data.data.map((item: CollectionItem & { images?: ImageResponse[] }) => ({
      ...item,
      images: transformImages(item.images),
    }));
  },

  async getCollectionItem(id: string): Promise<CollectionItem> {
    const response = await makeRequest(`/api/collection/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch collection item');
    }

    const data = await response.json();
    const item: CollectionItem & { images?: ImageResponse[] } = data.data;

    return {
      ...item,
      images: transformImages(item.images),
    };
  },

  async createCollectionItem(item: Omit<CollectionItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CollectionItem> {
    const response = await makeRequest('/api/collection', {
      method: 'POST',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create collection item');
    }

    const data = await response.json();
    const created: CollectionItem & { images?: ImageResponse[] } = data.data;

    return {
      ...created,
      images: transformImages(created.images),
    };
  },

  async updateCollectionItem(id: string, item: Partial<CollectionItem>): Promise<CollectionItem> {
    const response = await makeRequest(`/api/collection/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update collection item');
    }

    const data = await response.json();
    const updated: CollectionItem & { images?: ImageResponse[] } = data.data;

    return {
      ...updated,
      images: transformImages(updated.images),
    };
  },

  async deleteCollectionItem(id: string): Promise<void> {
    const response = await makeRequest(`/api/collection/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete collection item');
    }
  },

  // Coins
  searchCoins,
  getPriceGuide,
  getGrades,
  getCollectionSummary,
  syncCoinsCache,
  clearOldPriceCaches,

  // Performance
  async getMetalPerformance(): Promise<any> {
    const response = await makeRequest('/api/prices/performance');

    if (!response.ok) {
      throw new Error('Failed to fetch metal performance');
    }

    const data = await response.json();
    return data.data;
  },

  async getCoinPerformance(): Promise<any> {
    const response = await makeRequest('/api/coins/performance');

    if (!response.ok) {
      throw new Error('Failed to fetch coin performance');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get value history for an item
   * @param itemId - Collection item ID
   * @param limit - Max entries to return (default 30)
   */
  async getItemValueHistory(itemId: string, limit: number = 30): Promise<ValueHistoryEntry[]> {
    const response = await makeRequest(`/api/collection/${itemId}/history?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch value history');
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Sync guide prices for numismatic items
   * Updates numismaticValue from latest price guide and records value history
   * @param itemId - Optional single item to sync, otherwise syncs all guide_price items
   */
  async syncPrices(itemId?: string): Promise<{ synced: number; updated: number; message: string }> {
    const response = await makeRequest('/api/collection/sync-prices', {
      method: 'POST',
      body: JSON.stringify(itemId ? { itemId } : {}),
    });

    if (!response.ok) {
      throw new Error('Failed to sync prices');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get valuation breakdown by type (spot_premium, guide_price, custom)
   */
  async getValuationBreakdown(): Promise<ValuationBreakdown> {
    const response = await makeRequest('/api/portfolio/valuation-breakdown');

    if (!response.ok) {
      throw new Error('Failed to fetch valuation breakdown');
    }

    const data = await response.json();
    return data.data;
  },
};
