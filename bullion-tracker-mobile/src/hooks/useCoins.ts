import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { CoinReference, ValidGrade, PriceGuideData } from '../types';

/**
 * Search coins with debouncing
 */
export function useCoinSearch(query: string) {
  const [data, setData] = useState<CoinReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setData([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await api.searchCoins(query);
        setData(results);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  return { data, isLoading, error };
}

/**
 * Fetch price guide for coin + grade
 */
export function usePriceGuide(coinId: string | null | undefined, grade: string | null | undefined) {
  const [data, setData] = useState<PriceGuideData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coinId || !grade) {
      setData(null);
      return;
    }

    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const priceData = await api.getPriceGuide(coinId, grade);
        setData(priceData);
      } catch (err) {
        setError(err as Error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to avoid rapid API calls
    const timer = setTimeout(fetchPrice, 500);
    return () => clearTimeout(timer);
  }, [coinId, grade]);

  return { data, isLoading, error };
}

/**
 * Fetch all valid grades (cached)
 */
export function useGrades() {
  const [data, setData] = useState<ValidGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const grades = await api.getGrades();
        setData(grades);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  return { data, isLoading, error };
}

/**
 * Get collection summary
 */
export function useCollectionSummary() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      const summary = await api.getCollectionSummary();
      setData(summary);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { data, isLoading, error, refetch };
}
