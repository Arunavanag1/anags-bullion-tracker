import { CollectionItem, CalculatedValues, Metal, CollectionSummary } from '@/types';

/**
 * Calculate the current book value for a collection item based on valuation type
 *
 * Valuation types:
 * - 'spot_premium': Value = spot × weight × (1 + premiumPercent%). For bullion.
 * - 'guide_price': Value = numismaticValue from price guide. For numismatics.
 * - 'custom': Value = customBookValue. Fixed, doesn't change with market.
 *
 * Also handles legacy 'spot' and 'numismatic' values for backward compatibility.
 */
export function calculateCurrentBookValue(
  item: CollectionItem,
  currentSpotPrice: number
): number {
  // Handle by valuation type
  switch (item.bookValueType) {
    case 'spot_premium': {
      // Bullion: spot × weight × quantity × (1 + premium%)
      const quantity = 'quantity' in item ? item.quantity : 1;
      const totalWeight = (item.weightOz || 0) * quantity;
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

    // BACKWARD COMPATIBILITY: Handle legacy 'spot' value
    case 'spot' as unknown as typeof item.bookValueType: {
      // Treat as spot_premium with 0% premium
      const quantity = 'quantity' in item ? item.quantity : 1;
      const totalWeight = (item.weightOz || 0) * quantity;
      const meltValue = totalWeight * currentSpotPrice;
      const premiumMultiplier = 1 + ((item.premiumPercent || 0) / 100);
      return meltValue * premiumMultiplier;
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
 * Calculate the current melt value for a collection item
 */
export function calculateCurrentMeltValue(
  item: CollectionItem,
  currentSpotPrice: number
): number {
  const quantity = 'quantity' in item ? item.quantity : 1;
  return (item.weightOz || 0) * quantity * currentSpotPrice;
}

/**
 * Get the purchase price for an item
 * Uses purchasePrice if available, otherwise falls back to original book value
 */
export function getPurchasePrice(item: CollectionItem): number {
  // Use explicit purchase price if available
  if (item.purchasePrice !== undefined && item.purchasePrice !== null) {
    return item.purchasePrice;
  }

  // Fall back to custom book value (what they paid)
  if (item.customBookValue !== undefined && item.customBookValue !== null) {
    return item.customBookValue;
  }

  // Fall back to original melt value at creation
  const quantity = 'quantity' in item ? item.quantity : 1;
  const totalWeight = (item.weightOz || 0) * quantity;
  return totalWeight * (item.spotPriceAtCreation || 0);
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
  const purchasePrice = getPurchasePrice(item);

  // Calculate percent change: (Current Value - Purchase Price) / Purchase Price
  // Current Value uses the valuation methodology (book value)
  const percentChange = purchasePrice > 0
    ? ((currentBookValue - purchasePrice) / purchasePrice) * 100
    : 0;

  // Determine if book value is tracking spot
  // - spot_premium: tracks spot price (true)
  // - guide_price: tracks guide, not spot (false)
  // - custom: fixed value (false)
  // - legacy 'spot': tracks spot (true)
  const bookValueType = item.bookValueType as string;
  const isTracking = bookValueType === 'spot_premium' || bookValueType === 'spot';

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
    totalCostBasis: 0,
  };

  items.forEach((item) => {
    const quantity = 'quantity' in item ? item.quantity : 1;
    const totalWeight = (item.weightOz || 0) * quantity;
    const spotPrice = spotPrices[item.metal];

    // Add to metal totals
    if (item.metal === 'gold') summary.goldOz += totalWeight;
    if (item.metal === 'silver') summary.silverOz += totalWeight;
    if (item.metal === 'platinum') summary.platinumOz += totalWeight;

    // Add to value totals
    summary.totalMeltValue += calculateCurrentMeltValue(item, spotPrice);
    summary.totalBookValue += calculateCurrentBookValue(item, spotPrice);
    summary.totalCostBasis += getPurchasePrice(item);
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

