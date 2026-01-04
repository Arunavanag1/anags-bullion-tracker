import AsyncStorage from '@react-native-async-storage/async-storage';

const PORTFOLIO_HISTORY_KEY = 'portfolio_value_history';
const MAX_HISTORY_DAYS = 7; // Keep 7 days of history

interface PortfolioSnapshot {
  timestamp: number;
  value: number;
}

/**
 * Save the current portfolio value for daily tracking
 */
export async function savePortfolioValue(value: number): Promise<void> {
  try {
    const history = await getPortfolioHistory();
    const now = Date.now();

    // Add current snapshot
    history.push({
      timestamp: now,
      value,
    });

    // Keep only last 7 days and remove duplicates within same hour
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);

    const filtered = history
      .filter(snapshot => snapshot.timestamp > oneWeekAgo)
      .reduce((acc: PortfolioSnapshot[], snapshot) => {
        // Only keep one snapshot per hour to reduce storage
        const lastSnapshot = acc[acc.length - 1];
        const oneHour = 60 * 60 * 1000;
        if (!lastSnapshot || snapshot.timestamp - lastSnapshot.timestamp > oneHour) {
          acc.push(snapshot);
        }
        return acc;
      }, []);

    await AsyncStorage.setItem(PORTFOLIO_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save portfolio value:', error);
  }
}

/**
 * Get portfolio value from 24 hours ago
 */
export async function get24hAgoValue(): Promise<number | null> {
  try {
    const history = await getPortfolioHistory();
    if (history.length === 0) return null;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Find the snapshot closest to 24 hours ago
    let closest: PortfolioSnapshot | null = null;
    let closestDiff = Infinity;

    for (const snapshot of history) {
      const diff = Math.abs(snapshot.timestamp - oneDayAgo);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = snapshot;
      }
    }

    // Only return if we have data within 30 hours of the target time
    // (allows for some flexibility in tracking)
    const maxDiff = 30 * 60 * 60 * 1000; // 30 hours
    if (closest && closestDiff < maxDiff) {
      return closest.value;
    }

    return null;
  } catch (error) {
    console.error('Failed to get 24h ago value:', error);
    return null;
  }
}

/**
 * Calculate the daily gain (change from 24h ago)
 */
export async function calculateDailyGain(currentValue: number): Promise<number | null> {
  const yesterdayValue = await get24hAgoValue();
  if (yesterdayValue === null) return null;

  return currentValue - yesterdayValue;
}

async function getPortfolioHistory(): Promise<PortfolioSnapshot[]> {
  try {
    const data = await AsyncStorage.getItem(PORTFOLIO_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get portfolio history:', error);
    return [];
  }
}
