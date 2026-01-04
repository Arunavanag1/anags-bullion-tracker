export type Metal = 'gold' | 'silver' | 'platinum';

export type TimeRange = '24H' | '1W' | '1M' | '1Y' | '5Y';

export type ValuationMethod = 'spot' | 'book';

// Note: CollectionItem is now imported from api.ts to match backend schema
export { CollectionItem } from '../lib/api';

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  totalMeltValue: number;
  totalBookValue: number;
  totalGain: number;
  gainPercentage: number;
  itemCount: number;
  totalWeight: {
    gold: number;
    silver: number;
    platinum: number;
  };
}

export interface HistoricalPoint {
  date: string;
  meltValue: number;
  bookValue: number;
  timestamp: number;
}

export interface HistoricalPriceEntry {
  date: string;
  gold: number;
  silver: number;
  platinum: number;
}

export interface HistoricalPriceData {
  metadata: {
    description: string;
    source: string;
    lastUpdated: string;
    unit: string;
  };
  prices: HistoricalPriceEntry[];
}
