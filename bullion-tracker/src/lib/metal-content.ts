/**
 * Metal Content Calculation Utilities
 *
 * Provides functions for calculating precious metal content from
 * coin weight and purity. Used by:
 * - Cert lookup autofill (Phase 60)
 * - US historical coinage rules (Phase 59)
 * - Manual entry validation (Phase 61)
 * - Portfolio aggregation (Phase 62)
 */

export interface MetalContent {
  metalPurity: number | null;      // 0.0-1.0
  metalWeightOz: number | null;    // Total weight in troy oz
  preciousMetalOz: number | null;  // Calculated precious metal weight
}

/**
 * Calculate precious metal content from weight and purity.
 * Returns null if either input is null/undefined.
 */
export function calculatePreciousMetalOz(
  metalWeightOz: number | null | undefined,
  metalPurity: number | null | undefined
): number | null {
  if (metalWeightOz == null || metalPurity == null) {
    return null;
  }
  // Round to 6 decimal places to avoid floating point issues
  return Math.round(metalWeightOz * metalPurity * 1000000) / 1000000;
}

/**
 * Build a complete MetalContent object, calculating preciousMetalOz.
 */
export function buildMetalContent(
  metalWeightOz: number | null | undefined,
  metalPurity: number | null | undefined
): MetalContent {
  return {
    metalPurity: metalPurity ?? null,
    metalWeightOz: metalWeightOz ?? null,
    preciousMetalOz: calculatePreciousMetalOz(metalWeightOz, metalPurity),
  };
}

/**
 * Validate metal purity is in valid range (0.0 to 1.0).
 * Returns true if valid or null, false if invalid.
 */
export function isValidPurity(purity: number | null | undefined): boolean {
  if (purity == null) return true;
  return purity >= 0 && purity <= 1;
}

/**
 * Validate metal weight is positive.
 * Returns true if valid or null, false if invalid.
 */
export function isValidWeight(weight: number | null | undefined): boolean {
  if (weight == null) return true;
  return weight > 0;
}
