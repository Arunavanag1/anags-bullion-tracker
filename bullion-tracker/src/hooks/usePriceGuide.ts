import { useQuery } from '@tanstack/react-query';

export interface PriceGuideData {
  price: number | null;
  priceDate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export function usePriceGuide(coinReferenceId: string | null | undefined, grade: string | null | undefined) {
  return useQuery({
    queryKey: ['price-guide', coinReferenceId, grade],
    queryFn: async () => {
      if (!coinReferenceId || !grade) return null;

      const res = await fetch(
        `/api/coins/price-guide?coinReferenceId=${encodeURIComponent(coinReferenceId)}&grade=${encodeURIComponent(grade)}`
      );

      if (!res.ok) throw new Error('Failed to fetch price guide');

      const json = await res.json();
      return json.data as PriceGuideData | null;
    },
    enabled: !!coinReferenceId && !!grade,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
