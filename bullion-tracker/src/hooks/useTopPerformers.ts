import { useQuery } from '@tanstack/react-query';

interface MetalPerformance {
  metal: 'gold' | 'silver' | 'platinum';
  currentPrice: number;
  priceOneMonthAgo: number;
  change: number;
  changePercent: number;
}

interface CoinPerformance {
  id: string;
  title: string;
  grade: string;
  coinReferenceId: string;
  currentPrice: number;
  priceOneMonthAgo: number;
  change: number;
  changePercent: number;
  priceSource: string;
}

interface MetalPerformanceResponse {
  metals: MetalPerformance[];
  bestPerformer: MetalPerformance;
  worstPerformer: MetalPerformance;
  periodDays: number;
}

interface CoinPerformanceResponse {
  coins: CoinPerformance[];
  bestPerformer: CoinPerformance | null;
  worstPerformer: CoinPerformance | null;
  periodDays: number;
}

export function useMetalPerformance() {
  return useQuery<MetalPerformanceResponse>({
    queryKey: ['metal-performance'],
    queryFn: async () => {
      const response = await fetch('/api/prices/performance');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch metal performance');
      }

      return result.data;
    },
    staleTime: 8 * 60 * 60 * 1000, // 8 hours - align with price updates
  });
}

export function useCoinPerformance() {
  return useQuery<CoinPerformanceResponse>({
    queryKey: ['coin-performance'],
    queryFn: async () => {
      const response = await fetch('/api/coins/performance');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch coin performance');
      }

      return result.data;
    },
    staleTime: 8 * 60 * 60 * 1000, // 8 hours
  });
}

export function useTopPerformers() {
  const metalPerformance = useMetalPerformance();
  const coinPerformance = useCoinPerformance();

  return {
    metals: metalPerformance.data,
    coins: coinPerformance.data,
    isLoading: metalPerformance.isLoading || coinPerformance.isLoading,
    isError: metalPerformance.isError || coinPerformance.isError,
    error: metalPerformance.error || coinPerformance.error,
  };
}
