import { useQuery } from '@tanstack/react-query';
import type { CollectionSummary } from '@/types';

export function usePortfolioSummary() {
  return useQuery<CollectionSummary>({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/summary');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch portfolio summary');
      }

      return data.data;
    },
    refetchInterval: 60000, // Refetch every 60 seconds when prices update
  });
}
