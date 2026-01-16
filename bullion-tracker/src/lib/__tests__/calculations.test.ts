import { describe, it, expect } from 'vitest'
import {
  calculateCurrentBookValue,
  calculateCurrentMeltValue,
  getPurchasePrice,
  getCalculatedValues,
  calculateCollectionSummary,
} from '../calculations'
import type { CollectionItem } from '@/types'

// Helper to create a minimal valid CollectionItem for testing
function createItem(overrides: Partial<CollectionItem>): CollectionItem {
  return {
    id: 'test-1',
    type: 'itemized',
    userId: 'user-1',
    title: 'Test Item',
    metal: 'silver',
    quantity: 1,
    weightOz: 1,
    images: [],
    bookValueType: 'spot_premium',
    spotPriceAtCreation: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'BULLION',
    isProblemCoin: false,
    isGradeEstimated: false,
    ...overrides,
  } as CollectionItem
}

describe('calculateCurrentBookValue', () => {
  describe('spot_premium valuation type', () => {
    it('should calculate value with premium: spot × weight × quantity × (1 + premium%)', () => {
      const item = createItem({
        metal: 'gold',
        weightOz: 1,
        quantity: 2,
        premiumPercent: 5,
        bookValueType: 'spot_premium',
      })
      // 2000 × 1 × 2 × 1.05 = 4200
      expect(calculateCurrentBookValue(item, 2000)).toBe(4200)
    })

    it('should calculate value with 0% premium', () => {
      const item = createItem({
        weightOz: 1,
        quantity: 1,
        premiumPercent: 0,
        bookValueType: 'spot_premium',
      })
      // 30 × 1 × 1 × 1.0 = 30
      expect(calculateCurrentBookValue(item, 30)).toBe(30)
    })

    it('should handle missing premium (treat as 0%)', () => {
      const item = createItem({
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot_premium',
      })
      // 30 × 1 × 1 × 1.0 = 30
      expect(calculateCurrentBookValue(item, 30)).toBe(30)
    })

    it('should return 0 for 0 weight', () => {
      const item = createItem({
        weightOz: 0,
        quantity: 1,
        bookValueType: 'spot_premium',
      })
      expect(calculateCurrentBookValue(item, 30)).toBe(0)
    })
  })

  describe('guide_price valuation type', () => {
    it('should return numismaticValue regardless of spot price', () => {
      const item = createItem({
        bookValueType: 'guide_price',
        numismaticValue: 500,
      })
      // Should return 500 regardless of spot price
      expect(calculateCurrentBookValue(item, 30)).toBe(500)
      expect(calculateCurrentBookValue(item, 50)).toBe(500)
    })

    it('should return 0 if numismaticValue is undefined', () => {
      const item = createItem({
        bookValueType: 'guide_price',
        numismaticValue: undefined,
      })
      expect(calculateCurrentBookValue(item, 30)).toBe(0)
    })
  })

  describe('custom valuation type', () => {
    it('should return customBookValue regardless of spot price', () => {
      const item = createItem({
        bookValueType: 'custom',
        customBookValue: 1000,
      })
      expect(calculateCurrentBookValue(item, 30)).toBe(1000)
      expect(calculateCurrentBookValue(item, 50)).toBe(1000)
    })

    it('should return 0 if customBookValue is undefined', () => {
      const item = createItem({
        bookValueType: 'custom',
        customBookValue: undefined,
      })
      expect(calculateCurrentBookValue(item, 30)).toBe(0)
    })
  })

  describe('legacy spot valuation type', () => {
    it('should treat legacy "spot" as spot_premium', () => {
      const item = createItem({
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot' as any, // Legacy value
      })
      expect(calculateCurrentBookValue(item, 30)).toBe(30)
    })
  })
})

describe('calculateCurrentMeltValue', () => {
  it('should calculate melt value: weight × quantity × spot', () => {
    const item = createItem({
      weightOz: 1,
      quantity: 5,
    })
    // 1 × 5 × 30 = 150
    expect(calculateCurrentMeltValue(item, 30)).toBe(150)
  })

  it('should handle fractional weights', () => {
    const item = createItem({
      weightOz: 0.5,
      quantity: 2,
    })
    // 0.5 × 2 × 2000 = 2000
    expect(calculateCurrentMeltValue(item, 2000)).toBe(2000)
  })

  it('should handle bulk items (no quantity property)', () => {
    const item = createItem({
      type: 'bulk',
      weightOz: 1,
    })
    // Bulk items don't have quantity in the type, defaults to 1
    // 1 × 1 × 30 = 30
    expect(calculateCurrentMeltValue(item, 30)).toBe(30)
  })

  it('should return 0 for 0 weight', () => {
    const item = createItem({
      weightOz: 0,
      quantity: 5,
    })
    expect(calculateCurrentMeltValue(item, 30)).toBe(0)
  })
})

describe('getPurchasePrice', () => {
  it('should return purchasePrice when available', () => {
    const item = createItem({
      purchasePrice: 100,
      customBookValue: 150,
      spotPriceAtCreation: 25,
    })
    expect(getPurchasePrice(item)).toBe(100)
  })

  it('should fall back to customBookValue when no purchasePrice', () => {
    const item = createItem({
      purchasePrice: undefined,
      customBookValue: 150,
      spotPriceAtCreation: 25,
    })
    expect(getPurchasePrice(item)).toBe(150)
  })

  it('should fall back to original melt when neither purchasePrice nor customBookValue', () => {
    const item = createItem({
      purchasePrice: undefined,
      customBookValue: undefined,
      weightOz: 1,
      quantity: 1,
      spotPriceAtCreation: 25,
    })
    // 1 × 1 × 25 = 25
    expect(getPurchasePrice(item)).toBe(25)
  })

  it('should use 0 purchasePrice if explicitly set to 0', () => {
    const item = createItem({
      purchasePrice: 0,
      customBookValue: 150,
    })
    // 0 is falsy but should still be used (we check for undefined/null)
    // Note: current implementation checks `!== undefined && !== null`
    expect(getPurchasePrice(item)).toBe(0)
  })
})

describe('getCalculatedValues', () => {
  it('should return all calculated values', () => {
    const item = createItem({
      weightOz: 1,
      quantity: 1,
      bookValueType: 'spot_premium',
      premiumPercent: 0,
      purchasePrice: 25,
    })

    const result = getCalculatedValues(item, 30)

    expect(result.currentMeltValue).toBe(30)
    expect(result.currentBookValue).toBe(30)
    expect(result.isTracking).toBe(true)
  })

  it('should calculate percent change correctly', () => {
    const item = createItem({
      weightOz: 1,
      quantity: 1,
      bookValueType: 'spot_premium',
      premiumPercent: 0,
      purchasePrice: 25,
    })

    const result = getCalculatedValues(item, 30)

    // (30 - 25) / 25 × 100 = 20%
    expect(result.percentChange).toBe(20)
  })

  it('should return 0 percent change when purchase price is 0', () => {
    const item = createItem({
      weightOz: 1,
      quantity: 1,
      bookValueType: 'spot_premium',
      purchasePrice: 0,
      customBookValue: undefined,
      spotPriceAtCreation: 0,
    })

    const result = getCalculatedValues(item, 30)

    expect(result.percentChange).toBe(0)
  })

  it('should set isTracking true for spot_premium', () => {
    const item = createItem({
      bookValueType: 'spot_premium',
    })

    const result = getCalculatedValues(item, 30)

    expect(result.isTracking).toBe(true)
  })

  it('should set isTracking false for guide_price', () => {
    const item = createItem({
      bookValueType: 'guide_price',
      numismaticValue: 500,
    })

    const result = getCalculatedValues(item, 30)

    expect(result.isTracking).toBe(false)
  })

  it('should set isTracking false for custom', () => {
    const item = createItem({
      bookValueType: 'custom',
      customBookValue: 1000,
    })

    const result = getCalculatedValues(item, 30)

    expect(result.isTracking).toBe(false)
  })

  it('should set isTracking true for legacy spot', () => {
    const item = createItem({
      bookValueType: 'spot' as any,
    })

    const result = getCalculatedValues(item, 30)

    expect(result.isTracking).toBe(true)
  })
})

describe('calculateCollectionSummary', () => {
  const spotPrices = { gold: 2000, silver: 30, platinum: 1000 }

  describe('empty collection', () => {
    it('should return all zeros for empty array', () => {
      const result = calculateCollectionSummary([], spotPrices)

      expect(result.totalItems).toBe(0)
      expect(result.goldOz).toBe(0)
      expect(result.silverOz).toBe(0)
      expect(result.platinumOz).toBe(0)
      expect(result.totalMeltValue).toBe(0)
      expect(result.totalBookValue).toBe(0)
      expect(result.totalCostBasis).toBe(0)
    })
  })

  describe('single item collections', () => {
    it('should calculate gold item correctly', () => {
      const goldItem = createItem({
        metal: 'gold',
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 1800,
      })

      const result = calculateCollectionSummary([goldItem], spotPrices)

      expect(result.totalItems).toBe(1)
      expect(result.goldOz).toBe(1)
      expect(result.silverOz).toBe(0)
      expect(result.platinumOz).toBe(0)
      expect(result.totalMeltValue).toBe(2000) // 1 oz × $2000
      expect(result.totalBookValue).toBe(2000) // spot_premium with 0% premium
      expect(result.totalCostBasis).toBe(1800)
    })

    it('should calculate silver item correctly', () => {
      const silverItem = createItem({
        metal: 'silver',
        weightOz: 10,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 10,
        purchasePrice: 280,
      })

      const result = calculateCollectionSummary([silverItem], spotPrices)

      expect(result.totalItems).toBe(1)
      expect(result.goldOz).toBe(0)
      expect(result.silverOz).toBe(10)
      expect(result.platinumOz).toBe(0)
      expect(result.totalMeltValue).toBe(300) // 10 oz × $30
      expect(result.totalBookValue).toBe(330) // 300 × 1.10 (10% premium)
      expect(result.totalCostBasis).toBe(280)
    })

    it('should calculate platinum item correctly', () => {
      const platinumItem = createItem({
        metal: 'platinum',
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 5,
        purchasePrice: 950,
      })

      const result = calculateCollectionSummary([platinumItem], spotPrices)

      expect(result.totalItems).toBe(1)
      expect(result.goldOz).toBe(0)
      expect(result.silverOz).toBe(0)
      expect(result.platinumOz).toBe(1)
      expect(result.totalMeltValue).toBe(1000) // 1 oz × $1000
      expect(result.totalBookValue).toBe(1050) // 1000 × 1.05
      expect(result.totalCostBasis).toBe(950)
    })
  })

  describe('mixed metal collections', () => {
    it('should aggregate gold and silver correctly', () => {
      const goldItem = createItem({
        metal: 'gold',
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 1800,
      })

      const silverItem = createItem({
        id: 'test-2',
        metal: 'silver',
        weightOz: 10,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 280,
      })

      const result = calculateCollectionSummary([goldItem, silverItem], spotPrices)

      expect(result.totalItems).toBe(2)
      expect(result.goldOz).toBe(1)
      expect(result.silverOz).toBe(10)
      expect(result.platinumOz).toBe(0)
      expect(result.totalMeltValue).toBe(2300) // 2000 + 300
      expect(result.totalBookValue).toBe(2300)
      expect(result.totalCostBasis).toBe(2080) // 1800 + 280
    })

    it('should aggregate all three metals', () => {
      const goldItem = createItem({
        metal: 'gold',
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 1800,
      })

      const silverItem = createItem({
        id: 'test-2',
        metal: 'silver',
        weightOz: 10,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 280,
      })

      const platinumItem = createItem({
        id: 'test-3',
        metal: 'platinum',
        weightOz: 0.5,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 450,
      })

      const result = calculateCollectionSummary([goldItem, silverItem, platinumItem], spotPrices)

      expect(result.totalItems).toBe(3)
      expect(result.goldOz).toBe(1)
      expect(result.silverOz).toBe(10)
      expect(result.platinumOz).toBe(0.5)
      expect(result.totalMeltValue).toBe(2800) // 2000 + 300 + 500
      expect(result.totalBookValue).toBe(2800)
      expect(result.totalCostBasis).toBe(2530) // 1800 + 280 + 450
    })
  })

  describe('quantity handling', () => {
    it('should multiply weight by quantity', () => {
      const item = createItem({
        metal: 'silver',
        weightOz: 1, // 1 oz each
        quantity: 20, // 20 coins
        bookValueType: 'spot_premium',
        premiumPercent: 0,
        purchasePrice: 580, // Total paid
      })

      const result = calculateCollectionSummary([item], spotPrices)

      expect(result.silverOz).toBe(20) // 1 oz × 20 quantity
      expect(result.totalMeltValue).toBe(600) // 20 oz × $30
    })
  })

  describe('different valuation types', () => {
    it('should handle guide_price items', () => {
      const numismaticCoin = createItem({
        metal: 'gold',
        weightOz: 0.5,
        quantity: 1,
        bookValueType: 'guide_price',
        numismaticValue: 5000, // Rare coin worth more than melt
        purchasePrice: 4500,
      })

      const result = calculateCollectionSummary([numismaticCoin], spotPrices)

      expect(result.goldOz).toBe(0.5)
      expect(result.totalMeltValue).toBe(1000) // 0.5 oz × $2000
      expect(result.totalBookValue).toBe(5000) // Guide price
      expect(result.totalCostBasis).toBe(4500)
    })

    it('should handle custom valuation items', () => {
      const customItem = createItem({
        metal: 'silver',
        weightOz: 1,
        quantity: 1,
        bookValueType: 'custom',
        customBookValue: 100,
        purchasePrice: 90,
      })

      const result = calculateCollectionSummary([customItem], spotPrices)

      expect(result.silverOz).toBe(1)
      expect(result.totalMeltValue).toBe(30) // 1 oz × $30
      expect(result.totalBookValue).toBe(100) // Custom value
      expect(result.totalCostBasis).toBe(90)
    })

    it('should mix different valuation types correctly', () => {
      const bullionItem = createItem({
        metal: 'gold',
        weightOz: 1,
        quantity: 1,
        bookValueType: 'spot_premium',
        premiumPercent: 5,
        purchasePrice: 1900,
      })

      const numismaticItem = createItem({
        id: 'test-2',
        metal: 'gold',
        weightOz: 0.5,
        quantity: 1,
        bookValueType: 'guide_price',
        numismaticValue: 3000,
        purchasePrice: 2800,
      })

      const result = calculateCollectionSummary([bullionItem, numismaticItem], spotPrices)

      expect(result.totalItems).toBe(2)
      expect(result.goldOz).toBe(1.5) // 1 + 0.5
      expect(result.totalMeltValue).toBe(3000) // 2000 + 1000
      expect(result.totalBookValue).toBe(5100) // (2000 × 1.05) + 3000 = 2100 + 3000
      expect(result.totalCostBasis).toBe(4700) // 1900 + 2800
    })
  })
})
