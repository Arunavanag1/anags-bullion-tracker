// Metal types
export type Metal = 'gold' | 'silver' | 'platinum';
export type ItemType = 'itemized' | 'bulk';

/**
 * Valuation Type System:
 * - 'spot_premium': Value = spot × weight × (1 + premiumPercent%). For bullion.
 * - 'guide_price': Value = numismaticValue from price guide. For numismatics.
 * - 'custom': Value = customBookValue. Fixed, doesn't change with market.
 */
export type BookValueType = 'spot_premium' | 'guide_price' | 'custom';

// Spot Price Interface
export interface SpotPrice {
  metal: Metal;
  pricePerOz: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: Date;
}

// Collection Item Interfaces
export interface ItemizedPiece {
  id: string;
  type: 'itemized';
  userId: string;
  title: string;
  metal: Metal;
  quantity: number;
  weightOz: number;
  grade?: string;
  gradingService?: string;
  notes?: string;
  images: string[];
  bookValueType: BookValueType;
  customBookValue?: number;
  premiumPercent?: number;
  spotPriceAtCreation: number;
  createdAt: Date;
  updatedAt: Date;

  // Category and numismatic fields
  category: 'BULLION' | 'NUMISMATIC';
  coinReferenceId?: string;
  certNumber?: string;
  isProblemCoin: boolean;
  problemType?: string;
  isGradeEstimated: boolean;
  numismaticValue?: number;
  confidenceLevel?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
}

export interface BulkWeight {
  id: string;
  type: 'bulk';
  userId: string;
  metal: Metal;
  weightOz: number;
  notes?: string;
  images: string[];
  bookValueType: BookValueType;
  customBookValue?: number;
  premiumPercent?: number;
  spotPriceAtCreation: number;
  createdAt: Date;
  updatedAt: Date;

  // Category and numismatic fields
  category: 'BULLION' | 'NUMISMATIC';
  coinReferenceId?: string;
  certNumber?: string;
  grade?: string;
  gradingService?: string;
  isProblemCoin: boolean;
  problemType?: string;
  isGradeEstimated: boolean;
  numismaticValue?: number;
  confidenceLevel?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
}

export type CollectionItem = ItemizedPiece | BulkWeight;

// Form Data Interfaces
export interface ItemizedFormData {
  title: string;
  metal: Metal;
  quantity: number;
  weightOz: number;
  grade?: string;
  gradingService?: string;
  notes?: string;
  bookValueType: BookValueType;
  customBookValue?: number;
}

export interface BulkWeightFormData {
  metal: Metal;
  weightOz: number;
  notes?: string;
  bookValueType: BookValueType;
  customBookValue?: number;
}

// Portfolio Snapshot Interface
export interface PortfolioSnapshot {
  timestamp: Date;
  totalMeltValue: number;
  totalBookValue: number;
  goldOz: number;
  silverOz: number;
  platinumOz: number;
  goldPrice: number;
  silverPrice: number;
  platinumPrice: number;
}

// Collection Summary Interface
export interface CollectionSummary {
  totalItems: number;
  goldOz: number;
  silverOz: number;
  platinumOz: number;
  totalMeltValue: number;
  totalBookValue: number;
  totalCostBasis: number;
}

// Calculated Value Interface
export interface CalculatedValues {
  currentMeltValue: number;
  currentBookValue: number;
  percentChange: number;
  isTracking: boolean; // Whether book value is tracking spot
}

// Image Upload Interface
export interface ImageData {
  id: string;
  url: string;
  order: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SpotPricesResponse {
  gold: SpotPrice;
  silver: SpotPrice;
  platinum: SpotPrice;
}

// Time Range for Charts
export type TimeRange = '24H' | '1W' | '1M' | '1Y' | '5Y' | 'custom';

// Chart Data Point
export interface ChartDataPoint {
  timestamp: number;
  meltValue: number;
  bookValue: number;
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
    totalPremium: number;  // Total $ from premiums
    avgPremiumPercent: number;
  };
  guidePrice: {
    count: number;
    totalValue: number;
    totalMeltValue: number;  // For comparison
    premiumOverMelt: number;  // guide - melt as %
  };
  custom: {
    count: number;
    totalValue: number;
  };
  lastSyncDate: string | null;  // From most recent ItemValueHistory
}
