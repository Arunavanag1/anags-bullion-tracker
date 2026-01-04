// Metal types
export type Metal = 'gold' | 'silver' | 'platinum';
export type ItemType = 'itemized' | 'bulk';
export type BookValueType = 'custom' | 'spot';

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
  spotPriceAtCreation: number;
  createdAt: Date;
  updatedAt: Date;
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
  spotPriceAtCreation: number;
  createdAt: Date;
  updatedAt: Date;
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
export type TimeRange = '24H' | '1W' | '1M' | '1Y' | '5Y';

// Chart Data Point
export interface ChartDataPoint {
  timestamp: number;
  meltValue: number;
  bookValue: number;
}
