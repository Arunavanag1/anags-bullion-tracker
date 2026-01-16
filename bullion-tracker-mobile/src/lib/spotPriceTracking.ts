import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SpotPrices } from '../types';

const SPOT_PRICE_HISTORY_KEY = 'spot_price_history';
const MAX_HISTORY_DAYS = 7; // Keep 7 days of history

interface SpotPriceSnapshot {
  timestamp: number;
  gold: number;
  silver: number;
  platinum: number;
}

/**
 * Save current spot prices for daily tracking
 * Called when prices are fetched (every 8-12 hours based on cache)
 */
export async function saveSpotPrices(prices: SpotPrices): Promise<void> {
  try {
    const history = await getSpotPriceHistory();
    const now = Date.now();

    // Add current snapshot
    history.push({
      timestamp: now,
      gold: prices.gold,
      silver: prices.silver,
      platinum: prices.platinum,
    });

    // Keep only last 7 days and limit to one snapshot per 6 hours
    const oneWeekAgo = now - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);

    const filtered = history
      .filter(snapshot => snapshot.timestamp > oneWeekAgo)
      .reduce((acc: SpotPriceSnapshot[], snapshot) => {
        // Only keep one snapshot per 6 hours to reduce storage
        const lastSnapshot = acc[acc.length - 1];
        const sixHours = 6 * 60 * 60 * 1000;
        if (!lastSnapshot || snapshot.timestamp - lastSnapshot.timestamp > sixHours) {
          acc.push(snapshot);
        }
        return acc;
      }, []);

    await AsyncStorage.setItem(SPOT_PRICE_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save spot prices:', error);
  }
}

/**
 * Get spot prices from 24 hours ago
 */
export async function get24hAgoSpotPrices(): Promise<{ gold: number; silver: number; platinum: number } | null> {
  try {
    const history = await getSpotPriceHistory();
    if (history.length === 0) return null;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Find the snapshot closest to 24 hours ago
    let closest: SpotPriceSnapshot | null = null;
    let closestDiff = Infinity;

    for (const snapshot of history) {
      const diff = Math.abs(snapshot.timestamp - oneDayAgo);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = snapshot;
      }
    }

    // Only return if we have data within 30 hours of the target time
    const maxDiff = 30 * 60 * 60 * 1000; // 30 hours
    if (closest && closestDiff < maxDiff) {
      return {
        gold: closest.gold,
        silver: closest.silver,
        platinum: closest.platinum,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get 24h ago spot prices:', error);
    return null;
  }
}

/**
 * Calculate daily spot price changes
 */
export async function calculateDailySpotChanges(currentPrices: SpotPrices): Promise<{
  gold: { change: number; percent: number };
  silver: { change: number; percent: number };
  platinum: { change: number; percent: number };
} | null> {
  const yesterdayPrices = await get24hAgoSpotPrices();
  if (!yesterdayPrices) return null;

  const calcChange = (current: number, yesterday: number) => ({
    change: current - yesterday,
    percent: yesterday > 0 ? ((current - yesterday) / yesterday) * 100 : 0,
  });

  return {
    gold: calcChange(currentPrices.gold, yesterdayPrices.gold),
    silver: calcChange(currentPrices.silver, yesterdayPrices.silver),
    platinum: calcChange(currentPrices.platinum, yesterdayPrices.platinum),
  };
}

async function getSpotPriceHistory(): Promise<SpotPriceSnapshot[]> {
  try {
    const data = await AsyncStorage.getItem(SPOT_PRICE_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get spot price history:', error);
    return [];
  }
}
