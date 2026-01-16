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
 *
 * Total Return = currentValue - purchaseCost (cost basis at time of acquisition)
 * - For bullion: purchaseCost = spotPriceAtCreation × weight × quantity
 * - For numismatic: purchaseCost = purchasePrice or customBookValue
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

    // Calculate purchase cost (cost basis)
    // For bullion: spot price at creation × weight × quantity
    // For numismatic: purchase price or custom book value at creation
    const totalItemWeight = (item.weightOz || 0) * (item.quantity || 1);
    const purchaseCost = item.purchasePrice
      || item.customBookValue
      || (totalItemWeight * (item.spotPriceAtCreation || spotPrice));
    totalPurchaseCost += purchaseCost;

    // weightOz is already pure weight
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
