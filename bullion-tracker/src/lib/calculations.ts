import { CollectionItem, CalculatedValues, Metal, CollectionSummary } from '@/types';

/**
 * Calculate the current book value for a collection item based on current spot price
 * Implements the dynamic tracking logic:
 * - If custom book value is within 30% of spot melt value at creation, it tracks with spot
 * - Otherwise, it grows at 1% per annum from purchase date
 */
export function calculateCurrentBookValue(
  item: CollectionItem,
  currentSpotPrice: number
): number {
  const quantity = 'quantity' in item ? item.quantity : 1;
  const totalWeight = item.weightOz * quantity;
  const originalMelt = totalWeight * item.spotPriceAtCreation;

  // If using spot value, just return current melt value
  if (item.bookValueType === 'spot') {
    return totalWeight * currentSpotPrice;
  }

  // For custom book values
  const customValue = item.customBookValue!;
  const percentDiff = Math.abs((customValue - originalMelt) / originalMelt);

  // Within 30% threshold - track with spot price movement proportionally
  if (percentDiff <= 0.30) {
    const priceRatio = currentSpotPrice / item.spotPriceAtCreation;
    return customValue * priceRatio;
  }

  // Outside threshold - grows at 1% per annum
  if (item.purchaseDate) {
    const purchaseDate = new Date(item.purchaseDate);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const annualGrowthRate = 0.01; // 1% per annum
    return customValue * Math.pow(1 + annualGrowthRate, yearsElapsed);
  }

  // Fallback if no purchase date
  return customValue;
}

/**
 * Calculate the current melt value for a collection item
 */
export function calculateCurrentMeltValue(
  item: CollectionItem,
  currentSpotPrice: number
): number {
  const quantity = 'quantity' in item ? item.quantity : 1;
  return item.weightOz * quantity * currentSpotPrice;
}

/**
 * Get all calculated values for an item
 */
export function getCalculatedValues(
  item: CollectionItem,
  currentSpotPrice: number
): CalculatedValues {
  const currentMeltValue = calculateCurrentMeltValue(item, currentSpotPrice);
  const currentBookValue = calculateCurrentBookValue(item, currentSpotPrice);

  // Calculate percent change between book and melt
  const percentChange = ((currentBookValue - currentMeltValue) / currentMeltValue) * 100;

  // Determine if book value is tracking spot
  const quantity = 'quantity' in item ? item.quantity : 1;
  const totalWeight = item.weightOz * quantity;
  const originalMelt = totalWeight * item.spotPriceAtCreation;
  const customValue = item.customBookValue || 0;
  const percentDiff = Math.abs((customValue - originalMelt) / originalMelt);
  const isTracking = item.bookValueType === 'spot' || percentDiff <= 0.30;

  return {
    currentMeltValue,
    currentBookValue,
    percentChange,
    isTracking,
  };
}

/**
 * Calculate collection summary totals
 */
export function calculateCollectionSummary(
  items: CollectionItem[],
  spotPrices: { gold: number; silver: number; platinum: number }
): CollectionSummary {
  const summary: CollectionSummary = {
    totalItems: items.length,
    goldOz: 0,
    silverOz: 0,
    platinumOz: 0,
    totalMeltValue: 0,
    totalBookValue: 0,
  };

  items.forEach((item) => {
    const quantity = 'quantity' in item ? item.quantity : 1;
    const totalWeight = item.weightOz * quantity;
    const spotPrice = spotPrices[item.metal];

    // Add to metal totals
    if (item.metal === 'gold') summary.goldOz += totalWeight;
    if (item.metal === 'silver') summary.silverOz += totalWeight;
    if (item.metal === 'platinum') summary.platinumOz += totalWeight;

    // Add to value totals
    summary.totalMeltValue += calculateCurrentMeltValue(item, spotPrice);
    summary.totalBookValue += calculateCurrentBookValue(item, spotPrice);
  });

  return summary;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format weight in troy ounces
 */
export function formatWeight(oz: number): string {
  return `${oz.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} oz`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get metal emoji
 */
export function getMetalEmoji(metal: Metal): string {
  switch (metal) {
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'platinum':
      return '🪙';
    default:
      return '';
  }
}

/**
 * Get metal color for Tailwind classes
 */
export function getMetalColor(metal: Metal): string {
  switch (metal) {
    case 'gold':
      return '#D4AF37';
    case 'silver':
      return '#C0C0C0';
    case 'platinum':
      return '#E5E4E2';
    default:
      return '#6B7280';
  }
}
