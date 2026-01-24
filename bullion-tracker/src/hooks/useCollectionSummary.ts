import { useQuery } from '@tanstack/react-query';

export interface CollectionSummary {
  totalValue: number;
  totalItems: number;
  bullionValue: number;
  bullionCount: number;
  numismaticValue: number;
  numismaticCount: number;
  bullionByMetal: Record<string, { value: number; count: number }>;
  numismaticBySeries: Record<string, { value: number; count: number }>;
  // Precious metal from numismatic coins
  preciousMetalGoldOz: number;
  preciousMetalSilverOz: number;
  preciousMetalPlatinumOz: number;
}

export function useCollectionSummary() {
  return useQuery<CollectionSummary>({
    queryKey: ['collection-summary'],
    queryFn: async () => {
      const res = await fetch('/api/collection/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
  });
}
