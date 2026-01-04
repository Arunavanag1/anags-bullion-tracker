import { useQuery } from '@tanstack/react-query';

export interface CoinReference {
  id: string;
  pcgsNumber: number;
  year: number;
  mintMark?: string;
  denomination: string;
  series: string;
  fullName: string;
  metal?: string;
}

export function useCoinSearch(query: string) {
  return useQuery({
    queryKey: ['coin-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`/api/coins/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json() as Promise<CoinReference[]>;
    },
    enabled: query.length >= 2,
  });
}
