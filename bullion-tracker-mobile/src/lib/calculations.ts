import type { CollectionItem, PortfolioSummary, SpotPrices } from '../types';

/**
 * Calculate the current melt value of an item
 */
export function calculateMeltValue(item: CollectionItem, spotPrice: number): number {
  // weightOz is already pure weight, no purity calculation needed
  return item.weightOz * spotPrice * item.quantity;
}

/**
 * Calculate the book value of an item using premium-tracking logic
 *
 * Logic:
 * - If bookValueType is 'spot', use current melt value
 * - If bookValueType is 'custom':
 *   - Check at purchase: if purchase price was >30% different from melt value
 *   - If YES (numismatic): book value = purchase price + 1% per year (compounded)
 *   - If NO (bullion): book value = current melt + original premium (tracks spot)
 */
export function calculateBookValue(item: CollectionItem, currentSpotPrice: number): number {
  const totalWeight = item.weightOz * item.quantity;
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

  // Outside threshold - grows at 1% per annum (compounded)
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
 * Calculate gain/loss for an item
 */
export function calculateGain(item: CollectionItem, spotPrice: number): number {
  const meltValue = calculateMeltValue(item, spotPrice);
  const bookValue = calculateBookValue(item, spotPrice);
  return meltValue - bookValue;
}

/**
 * Calculate gain percentage for an item
 */
export function calculateGainPercentage(item: CollectionItem, spotPrice: number): number {
  const gain = calculateGain(item, spotPrice);
  const bookValue = calculateBookValue(item, spotPrice);
  if (bookValue === 0) return 0;
  return (gain / bookValue) * 100;
}

/**
 * Calculate portfolio summary from collection items
 */
export function calculatePortfolioSummary(
  items: CollectionItem[],
  spotPrices: SpotPrices
): PortfolioSummary {
  let totalMeltValue = 0;
  let totalBookValue = 0;
  const totalWeight = {
    gold: 0,
    silver: 0,
    platinum: 0,
  };

  items.forEach(item => {
    const metalKey = item.metal as 'gold' | 'silver' | 'platinum';
    const spotPrice = spotPrices[metalKey];
    if (typeof spotPrice !== 'number') return; // Skip if price is not available

    totalMeltValue += calculateMeltValue(item, spotPrice);
    totalBookValue += calculateBookValue(item, spotPrice);
    // weightOz is already pure weight
    totalWeight[metalKey] += item.weightOz * item.quantity;
  });

  const totalGain = totalMeltValue - totalBookValue;
  const gainPercentage = totalBookValue > 0 ? (totalGain / totalBookValue) * 100 : 0;

  return {
    totalMeltValue,
    totalBookValue,
    totalGain,
    gainPercentage,
    itemCount: items.length,
    totalWeight,
  };
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
 * Format weight with proper unit
 */
export function formatWeight(weight: number): string {
  return `${weight.toFixed(3)} oz`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
