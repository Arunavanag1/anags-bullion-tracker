import { useQuery } from '@tanstack/react-query';
import { SpotPricesResponse } from '@/types';

export function useSpotPrices() {
  return useQuery<SpotPricesResponse>({
    queryKey: ['spotPrices'],
    queryFn: async () => {
      const response = await fetch('/api/prices');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prices');
      }

      // Convert date strings back to Date objects
      return {
        gold: { ...data.data.gold, lastUpdated: new Date(data.data.gold.lastUpdated) },
        silver: { ...data.data.silver, lastUpdated: new Date(data.data.silver.lastUpdated) },
        platinum: { ...data.data.platinum, lastUpdated: new Date(data.data.platinum.lastUpdated) },
      };
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: 3,
  });
}
