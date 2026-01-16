import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Constants from 'expo-constants';
import { fetchSpotPrices } from '../lib/prices';
import { saveSpotPrices, get24hAgoSpotPrices } from '../lib/spotPriceTracking';
import type { SpotPrices } from '../types';

interface SpotPricesContextType {
  spotPrices: SpotPrices | null;
  spotPrices24hAgo: { gold: number; silver: number; platinum: number } | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const SpotPricesContext = createContext<SpotPricesContextType | undefined>(undefined);

export function SpotPricesProvider({ children }: { children: ReactNode }) {
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [spotPrices24hAgo, setSpotPrices24hAgo] = useState<{ gold: number; silver: number; platinum: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiKey = Constants.expoConfig?.extra?.metalPriceApiKey || '';
      const prices = await fetchSpotPrices(apiKey);
      setSpotPrices(prices);

      // Save current prices to history for future 24h comparisons
      await saveSpotPrices(prices);

      // Load 24h ago prices for daily change calculations
      const prices24hAgo = await get24hAgoSpotPrices();
      setSpotPrices24hAgo(prices24hAgo);
    } catch (err) {
      console.error('Failed to fetch spot prices:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch spot prices'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load prices on mount
  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const refresh = useCallback(async () => {
    await loadPrices();
  }, [loadPrices]);

  return (
    <SpotPricesContext.Provider
      value={{
        spotPrices,
        spotPrices24hAgo,
        isLoading,
        error,
        refresh,
      }}
    >
      {children}
    </SpotPricesContext.Provider>
  );
}

export function useSpotPrices() {
  const context = useContext(SpotPricesContext);
  if (context === undefined) {
    throw new Error('useSpotPrices must be used within a SpotPricesProvider');
  }
  return context;
}
