import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Constants from 'expo-constants';
import { fetchSpotPrices } from '../lib/prices';
import type { SpotPrices } from '../types';

interface SpotPricesContextType {
  spotPrices: SpotPrices | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const SpotPricesContext = createContext<SpotPricesContextType | undefined>(undefined);

export function SpotPricesProvider({ children }: { children: ReactNode }) {
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiKey = Constants.expoConfig?.extra?.metalPriceApiKey || '';
      const prices = await fetchSpotPrices(apiKey);
      setSpotPrices(prices);
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
