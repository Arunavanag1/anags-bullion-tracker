export type Metal = 'gold' | 'silver' | 'platinum';

export type TimeRange = '24H' | '1W' | '1M' | '1Y' | '5Y';

export type ItemCategory = 'BULLION' | 'NUMISMATIC';

export type GradingService = 'PCGS' | 'NGC' | 'RAW';

export type ProblemType = 'cleaned' | 'damaged' | 'holed' | 'repaired';

export type BookValueType = 'spot_premium' | 'guide_price' | 'custom';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

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
  bullionValue: number;
  numismaticValue: number;
  totalValue: number;
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

// ===== NUMISMATIC TYPES =====

export interface CoinReference {
  id: string;
  pcgsNumber: string;
  fullName: string;
  series: string;
  year: number;
  mintMark: string | null;
  denomination: string;
  metal: string;
  weightOz: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidGrade {
  gradeCode: string;
  numericValue: number;
  gradeCategory: string;
  displayOrder: number;
}

export interface PriceGuideData {
  price: number | null;
  priceDate: string;
  confidenceLevel: ConfidenceLevel;
  isStale?: boolean;
}

export interface CollectionSummary {
  totalValue: number;
  bullionValue: number;
  numismaticValue: number;
  totalItems: number;
  bullionItems: number;
  numismaticItems: number;
  byMetal: {
    [metal: string]: {
      weightOz: number;
      value: number;
      items: number;
    };
  };
}

// Value History Entry for tracking item value changes over time
export interface ValueHistoryEntry {
  priceDate: string;
  value: number;
  source: string | null;
}

// Valuation Breakdown for portfolio dashboard
export interface ValuationBreakdown {
  spotPremium: {
    count: number;
    totalValue: number;
    totalPremium: number;
    avgPremiumPercent: number;
  };
  guidePrice: {
    count: number;
    totalValue: number;
    totalMeltValue: number;
    premiumOverMelt: number;
  };
  custom: {
    count: number;
    totalValue: number;
  };
  lastSyncDate: string | null;
}
