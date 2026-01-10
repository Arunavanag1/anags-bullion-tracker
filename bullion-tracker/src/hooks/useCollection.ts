import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CollectionItem, ItemizedFormData, BulkWeightFormData, TimeRange } from '@/types';

export function useCollection() {
  return useQuery({
    queryKey: ['collection'],
    queryFn: async () => {
      const response = await fetch('/api/collection');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch collection');
      }

      // Convert date strings to Date objects
      return data.data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        images: item.images.map((img: any) => img.url),
      }));
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: (ItemizedFormData | BulkWeightFormData) & { images?: string[] }) => {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add item');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CollectionItem> }) => {
      const response = await fetch(`/api/collection/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update item');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/collection/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete item');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

interface HistoricalPoint {
  date: string;
  meltValue: number;
  bookValue: number;
  bullionValue: number;
  numismaticValue: number;
  totalValue: number;
  timestamp: number;
}

const TIME_RANGE_DAYS: Partial<Record<TimeRange, number>> = {
  '24H': 1,
  '1W': 7,
  '1M': 30,
  '1Y': 365,
  '5Y': 1825,
  // 'custom' is handled via customStartDate/customEndDate params
};

interface PortfolioHistoryParams {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export function usePortfolioHistory({ timeRange, customStartDate, customEndDate }: PortfolioHistoryParams) {
  const isCustomRange = timeRange === 'custom' && customStartDate && customEndDate;

  return useQuery<HistoricalPoint[]>({
    queryKey: ['portfolio-history', timeRange, customStartDate, customEndDate],
    queryFn: async () => {
      let url: string;
      if (isCustomRange) {
        url = `/api/portfolio/history?startDate=${customStartDate}&endDate=${customEndDate}`;
      } else {
        const days = TIME_RANGE_DAYS[timeRange as keyof typeof TIME_RANGE_DAYS] || 30;
        url = `/api/portfolio/history?days=${days}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.data) {
        throw new Error('Failed to fetch portfolio history');
      }

      return result.data;
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 hours - align with price cache
  });
}
