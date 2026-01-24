/**
 * US Historical Coinage Rules Engine
 *
 * Provides automatic metal content detection for US historical coins based on
 * denomination and year. Used by collection item creation to auto-populate
 * metalPurity, metalWeightOz, and preciousMetalOz fields.
 *
 * References: US Mint specifications, PCGS CoinFacts, NGC Coin Explorer
 * Research: .planning/phases/59-us-historical-coinage-rules/RESEARCH.md
 */

import type { MetalContent } from './metal-content';

export interface USCoinRule {
  denomination: string;
  aliases: string[];
  yearRange: { start: number; end: number };
  metalType: 'gold' | 'silver';
  purity: number; // 0.0-1.0
  totalWeightOz: number;
  preciousMetalOz: number;
  notes?: string;
}

/**
 * Pre-1965 and transitional silver coin specifications
 */
export const SILVER_COIN_RULES: USCoinRule[] = [
  // Pre-1965 90% silver coins
  {
    denomination: 'dime',
    aliases: ['10C', '10 Cent', '10-Cent', '10 Cents'],
    yearRange: { start: 1892, end: 1964 },
    metalType: 'silver',
    purity: 0.900,
    totalWeightOz: 0.0804,
    preciousMetalOz: 0.07234,
    notes: 'Barber, Mercury, and Roosevelt dimes',
  },
  {
    denomination: 'quarter',
    aliases: ['25C', '25 Cent', '25-Cent', '25 Cents', 'Quarter Dollar'],
    yearRange: { start: 1892, end: 1964 },
    metalType: 'silver',
    purity: 0.900,
    totalWeightOz: 0.2010,
    preciousMetalOz: 0.18084,
    notes: 'Barber, Standing Liberty, and Washington quarters',
  },
  {
    denomination: 'half dollar',
    aliases: ['50C', '50 Cent', '50-Cent', '50 Cents', 'Half'],
    yearRange: { start: 1892, end: 1964 },
    metalType: 'silver',
    purity: 0.900,
    totalWeightOz: 0.4019,
    preciousMetalOz: 0.36169,
    notes: 'Barber, Walking Liberty, Franklin, and 1964 Kennedy',
  },
  // 40% silver Kennedy half dollars (1965-1970)
  {
    denomination: 'half dollar',
    aliases: ['50C', '50 Cent', '50-Cent', '50 Cents', 'Half', 'Kennedy'],
    yearRange: { start: 1965, end: 1970 },
    metalType: 'silver',
    purity: 0.400,
    totalWeightOz: 0.36975,
    preciousMetalOz: 0.14792,
    notes: '40% silver Kennedy half dollars',
  },
  // Morgan and Peace dollars
  {
    denomination: 'dollar',
    aliases: ['$1', '1 Dollar', 'One Dollar', 'Morgan', 'Peace'],
    yearRange: { start: 1878, end: 1935 },
    metalType: 'silver',
    purity: 0.900,
    totalWeightOz: 0.8594,
    preciousMetalOz: 0.77344,
    notes: 'Morgan (1878-1921) and Peace (1921-1935) dollars',
  },
  // War nickels (1942-1945) - 35% silver
  {
    denomination: 'nickel',
    aliases: ['5C', '5 Cent', '5-Cent', '5 Cents', 'War Nickel', 'Jefferson'],
    yearRange: { start: 1942, end: 1945 },
    metalType: 'silver',
    purity: 0.350,
    totalWeightOz: 0.16075,
    preciousMetalOz: 0.05626,
    notes: 'War nickels with large mintmark above Monticello',
  },
];

/**
 * Pre-1933 gold coin specifications
 */
export const GOLD_COIN_RULES: USCoinRule[] = [
  {
    denomination: '$1 gold',
    aliases: ['$1', 'Gold Dollar', '1 Dollar Gold', 'One Dollar Gold'],
    yearRange: { start: 1849, end: 1889 },
    metalType: 'gold',
    purity: 0.900,
    totalWeightOz: 0.05376,
    preciousMetalOz: 0.04837,
    notes: 'Type 1 (1849-1854), Type 2 (1854-1856), Type 3 (1856-1889)',
  },
  {
    denomination: '$2.50',
    aliases: ['$2 1/2', 'Quarter Eagle', '2.50', 'Two and a Half'],
    yearRange: { start: 1796, end: 1929 },
    metalType: 'gold',
    purity: 0.900,
    totalWeightOz: 0.13438,
    preciousMetalOz: 0.12094,
    notes: 'Liberty Head and Indian Head Quarter Eagles',
  },
  {
    denomination: '$3',
    aliases: ['Three Dollar', '3 Dollar', 'Three Dollars'],
    yearRange: { start: 1854, end: 1889 },
    metalType: 'gold',
    purity: 0.900,
    totalWeightOz: 0.16124,
    preciousMetalOz: 0.14512,
    notes: 'Indian Princess $3 gold pieces',
  },
  {
    denomination: '$5',
    aliases: ['Half Eagle', '5 Dollar', 'Five Dollar', 'Five Dollars'],
    yearRange: { start: 1795, end: 1929 },
    metalType: 'gold',
    purity: 0.900,
    totalWeightOz: 0.26875,
    preciousMetalOz: 0.24187,
    notes: 'Liberty Head and Indian Head Half Eagles',
  },
  {
    denomination: '$10',
    aliases: ['Eagle', '10 Dollar', 'Ten Dollar', 'Ten Dollars'],
    yearRange: { start: 1795, end: 1933 },
    metalType: 'gold',
    purity: 0.900,
    totalWeightOz: 0.53750,
    preciousMetalOz: 0.48375,
    notes: 'Liberty Head and Indian Head Eagles',
  },
  {
    denomination: '$20',
    aliases: ['Double Eagle', '20 Dollar', 'Twenty Dollar', 'Twenty Dollars', 'Saint-Gaudens', 'Saint Gaudens'],
    yearRange: { start: 1849, end: 1933 },
    metalType: 'gold',
    purity: 0.900,
    totalWeightOz: 1.07500,
    preciousMetalOz: 0.96750,
    notes: 'Liberty Head and Saint-Gaudens Double Eagles',
  },
];

/**
 * Normalize denomination string for matching
 */
function normalizeUSCoinDenomination(rawDenom: string): string {
  return rawDenom
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/-/g, ' ');
}

/**
 * Check if a denomination string matches a rule
 */
function denominationMatches(inputDenom: string, rule: USCoinRule): boolean {
  const normalized = normalizeUSCoinDenomination(inputDenom);
  const ruleDenom = normalizeUSCoinDenomination(rule.denomination);

  // Direct denomination match
  if (normalized.includes(ruleDenom)) {
    return true;
  }

  // Check aliases
  for (const alias of rule.aliases) {
    const normalizedAlias = normalizeUSCoinDenomination(alias);
    if (normalized.includes(normalizedAlias)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect metal content for US historical coins based on denomination and year.
 *
 * @param denomination - The coin denomination (e.g., "Quarter", "50C", "$20")
 * @param year - The coin's mint year
 * @returns MetalContent if a matching rule is found, null otherwise
 */
export function detectUSCoinMetalContent(
  denomination: string,
  year: number
): MetalContent | null {
  // Check silver rules first (more common in collections)
  for (const rule of SILVER_COIN_RULES) {
    if (
      denominationMatches(denomination, rule) &&
      year >= rule.yearRange.start &&
      year <= rule.yearRange.end
    ) {
      return {
        metalPurity: rule.purity,
        metalWeightOz: rule.totalWeightOz,
        preciousMetalOz: rule.preciousMetalOz,
      };
    }
  }

  // Check gold rules
  for (const rule of GOLD_COIN_RULES) {
    if (
      denominationMatches(denomination, rule) &&
      year >= rule.yearRange.start &&
      year <= rule.yearRange.end
    ) {
      return {
        metalPurity: rule.purity,
        metalWeightOz: rule.totalWeightOz,
        preciousMetalOz: rule.preciousMetalOz,
      };
    }
  }

  return null;
}

/**
 * Get the matching rule for a US coin (for debugging/display purposes)
 */
export function getMatchingUSCoinRule(
  denomination: string,
  year: number
): USCoinRule | null {
  // Check silver rules first
  for (const rule of SILVER_COIN_RULES) {
    if (
      denominationMatches(denomination, rule) &&
      year >= rule.yearRange.start &&
      year <= rule.yearRange.end
    ) {
      return rule;
    }
  }

  // Check gold rules
  for (const rule of GOLD_COIN_RULES) {
    if (
      denominationMatches(denomination, rule) &&
      year >= rule.yearRange.start &&
      year <= rule.yearRange.end
    ) {
      return rule;
    }
  }

  return null;
}
