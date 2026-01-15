import { useQuery } from '@tanstack/react-query';
import type { ValuationBreakdown } from '@/types';

export function useValuationBreakdown() {
  return useQuery<ValuationBreakdown>({
    queryKey: ['portfolio', 'valuation-breakdown'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/valuation-breakdown');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch valuation breakdown');
      }

      return data.data;
    },
    refetchInterval: 60000, // Refetch every 60 seconds when prices update
  });
}
