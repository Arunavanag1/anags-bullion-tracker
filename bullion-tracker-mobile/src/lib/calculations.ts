import type { CollectionItem, PortfolioSummary, SpotPrices } from '../types';

/**
 * Calculate the current melt value of an item
 */
export function calculateMeltValue(item: CollectionItem, spotPrice: number): number {
  // weightOz is already pure weight, no purity calculation needed
  return (item.weightOz || 0) * spotPrice * (item.quantity || 1);
}

/**
 * Calculate the book value of an item based on valuation type
 *
 * Valuation types:
 * - 'spot_premium': Value = spot × weight × (1 + premiumPercent%). For bullion.
 * - 'guide_price': Value = numismaticValue from price guide. For numismatics.
 * - 'custom': Value = customBookValue. Fixed, doesn't change with market.
 * - Legacy 'spot': Treat as spot_premium with 0% premium
 */
export function calculateBookValue(item: CollectionItem, currentSpotPrice: number): number {
  const totalWeight = (item.weightOz || 0) * (item.quantity || 1);
  const bookValueType = item.bookValueType as string;

  // Handle by valuation type
  switch (bookValueType) {
    case 'spot_premium':
    case 'spot': {
      // Bullion: spot × weight × quantity × (1 + premium%)
      const meltValue = totalWeight * currentSpotPrice;
      const premiumMultiplier = 1 + ((item.premiumPercent || 0) / 100);
      return meltValue * premiumMultiplier;
    }

    case 'guide_price': {
      // Numismatic: use numismaticValue (guide price)
      return item.numismaticValue ?? 0;
    }

    case 'custom': {
      // Fixed value: customBookValue doesn't change
      return item.customBookValue ?? 0;
    }

    default: {
      // Legacy 'numismatic' or unknown - try numismaticValue, then customBookValue, then 0
      if (item.numismaticValue !== undefined) return item.numismaticValue;
      if (item.customBookValue !== undefined) return item.customBookValue;
      return 0;
    }
  }
}

/**
 * Calculate the purchase cost (cost basis) for an item
 */
export function calculatePurchaseCost(item: CollectionItem, currentSpotPrice: number): number {
  const bookValueType = item.bookValueType as string;
  const totalItemWeight = (item.weightOz || 0) * (item.quantity || 1);

  // For numismatics (guide_price, custom): use purchasePrice
  if (bookValueType === 'guide_price' || bookValueType === 'custom' || bookValueType === 'numismatic') {
    return item.purchasePrice ?? 0;
  }

  // For bullion (spot_premium, spot): use spot at creation × weight
  // Fall back to purchasePrice if available, otherwise current spot
  return item.purchasePrice
    ?? (totalItemWeight * (item.spotPriceAtCreation || currentSpotPrice));
}

/**
 * Calculate gain/loss for an item
 * - For bullion: meltValue - purchaseCost
 * - For numismatic: bookValue (guide/custom) - purchasePrice
 */
export function calculateGain(item: CollectionItem, spotPrice: number): number {
  const bookValue = calculateBookValue(item, spotPrice);
  const purchaseCost = calculatePurchaseCost(item, spotPrice);

  // Return = current value - what you paid
  return bookValue - purchaseCost;
}

/**
 * Calculate gain percentage for an item
 */
export function calculateGainPercentage(item: CollectionItem, spotPrice: number): number {
  const gain = calculateGain(item, spotPrice);
  const purchaseCost = calculatePurchaseCost(item, spotPrice);
  if (purchaseCost === 0) return 0;
  return (gain / purchaseCost) * 100;
}

/**
 * Calculate portfolio summary from collection items
 *
 * Total Return = currentValue (bookValue) - purchaseCost
 * - For bullion: purchaseCost = spotPriceAtCreation × weight × quantity
 * - For numismatic: purchaseCost = purchasePrice (what you paid)
 */
export function calculatePortfolioSummary(
  items: CollectionItem[],
  spotPrices: SpotPrices
): PortfolioSummary {
  let totalMeltValue = 0;
  let totalBookValue = 0;
  let totalPurchaseCost = 0;
  const totalWeight = {
    gold: 0,
    silver: 0,
    platinum: 0,
  };

  items.forEach(item => {
    const metalKey = item.metal as 'gold' | 'silver' | 'platinum';
    const spotPrice = spotPrices[metalKey];
    if (typeof spotPrice !== 'number') return; // Skip if price is not available

    const meltValue = calculateMeltValue(item, spotPrice);
    const bookValue = calculateBookValue(item, spotPrice);

    totalMeltValue += meltValue;
    totalBookValue += bookValue;

    // Calculate purchase cost using shared function
    const purchaseCost = calculatePurchaseCost(item, spotPrice);
    totalPurchaseCost += purchaseCost;

    // weightOz is already pure weight
    const totalItemWeight = (item.weightOz || 0) * (item.quantity || 1);
    totalWeight[metalKey] += totalItemWeight;
  });

  // Total gain = current book value - purchase cost (what you paid)
  const totalGain = totalBookValue - totalPurchaseCost;
  const gainPercentage = totalPurchaseCost > 0 ? (totalGain / totalPurchaseCost) * 100 : 0;

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
 * Format currency value in compact form for large numbers
 * e.g., $1,234.56 -> $1.2k
 */
export function formatCurrencyCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000) {
    // Format as $x.xk for values >= $1,000
    const inThousands = absValue / 1000;
    return `${sign}$${inThousands.toFixed(1)}k`;
  }

  // Use regular formatting for values under $1,000
  return formatCurrency(value);
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
