import { describe, it, expect } from 'vitest';
import {
  detectUSCoinMetalContent,
  getMatchingUSCoinRule,
  SILVER_COIN_RULES,
  GOLD_COIN_RULES,
} from '../us-coinage-rules';

describe('US Coinage Rules Engine', () => {
  describe('detectUSCoinMetalContent - Silver Coins', () => {
    it('should detect 90% silver dime (1964)', () => {
      const result = detectUSCoinMetalContent('10C', 1964);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.07234);
    });

    it('should detect 90% silver dime by name (1892)', () => {
      const result = detectUSCoinMetalContent('Dime', 1892);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.metalWeightOz).toBe(0.0804);
    });

    it('should detect 90% silver quarter (1932)', () => {
      const result = detectUSCoinMetalContent('Quarter', 1932);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.18084);
    });

    it('should detect 90% silver quarter by code (25C)', () => {
      const result = detectUSCoinMetalContent('25C', 1964);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.18084);
    });

    it('should detect 90% silver half dollar (1964)', () => {
      const result = detectUSCoinMetalContent('Half Dollar', 1964);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.36169);
    });

    it('should detect 40% silver Kennedy half dollar (1967)', () => {
      const result = detectUSCoinMetalContent('Half Dollar', 1967);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.4);
      expect(result!.preciousMetalOz).toBe(0.14792);
    });

    it('should detect 40% silver Kennedy half dollar (1970)', () => {
      const result = detectUSCoinMetalContent('50C', 1970);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.4);
    });

    it('should detect Morgan/Peace dollar (1921)', () => {
      const result = detectUSCoinMetalContent('Dollar', 1921);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.77344);
    });

    it('should detect Peace dollar (1923)', () => {
      const result = detectUSCoinMetalContent('$1', 1923);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.77344);
    });

    it('should detect war nickel (1943)', () => {
      const result = detectUSCoinMetalContent('Nickel', 1943);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.35);
      expect(result!.preciousMetalOz).toBe(0.05626);
    });

    it('should detect war nickel by code (5C)', () => {
      const result = detectUSCoinMetalContent('5C', 1944);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.35);
    });
  });

  describe('detectUSCoinMetalContent - Gold Coins', () => {
    it('should detect $20 Double Eagle (1928)', () => {
      const result = detectUSCoinMetalContent('$20', 1928);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.9675);
    });

    it('should detect Saint-Gaudens Double Eagle', () => {
      const result = detectUSCoinMetalContent('Saint-Gaudens', 1924);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.9675);
    });

    it('should detect $10 Eagle (1907)', () => {
      const result = detectUSCoinMetalContent('$10', 1907);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.48375);
    });

    it('should detect $10 Eagle by denomination', () => {
      const result = detectUSCoinMetalContent('10 Dollar', 1910);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.48375);
    });

    it('should detect $5 Half Eagle (1900)', () => {
      const result = detectUSCoinMetalContent('$5', 1900);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.24187);
    });

    it('should detect $5 Half Eagle by denomination', () => {
      const result = detectUSCoinMetalContent('5 Dollar', 1908);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.24187);
    });

    it('should detect $2.50 Quarter Eagle (1915)', () => {
      const result = detectUSCoinMetalContent('$2.50', 1915);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.12094);
    });

    it('should detect $2.50 Quarter Eagle by alias', () => {
      const result = detectUSCoinMetalContent('$2 1/2', 1908);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.12094);
    });

    it('should detect $3 Gold (1878)', () => {
      const result = detectUSCoinMetalContent('$3', 1878);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.14512);
    });

    it('should detect $1 Gold Dollar (1860)', () => {
      const result = detectUSCoinMetalContent('$1 gold', 1860);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.04837);
    });

    it('should detect Gold Dollar by name', () => {
      const result = detectUSCoinMetalContent('Gold Dollar', 1854);
      expect(result).not.toBeNull();
      expect(result!.preciousMetalOz).toBe(0.04837);
    });
  });

  describe('detectUSCoinMetalContent - Edge Cases', () => {
    it('should return null for post-silver era half dollar (1971)', () => {
      const result = detectUSCoinMetalContent('Half Dollar', 1971);
      expect(result).toBeNull();
    });

    it('should return null for clad quarter (1965)', () => {
      const result = detectUSCoinMetalContent('Quarter', 1965);
      expect(result).toBeNull();
    });

    it('should return null for post-war nickel (1946)', () => {
      const result = detectUSCoinMetalContent('Nickel', 1946);
      expect(result).toBeNull();
    });

    it('should return null for post-recall gold coin ($20 1934)', () => {
      const result = detectUSCoinMetalContent('$20', 1934);
      expect(result).toBeNull();
    });

    it('should return null for unknown denomination', () => {
      const result = detectUSCoinMetalContent('Unknown Coin', 1900);
      expect(result).toBeNull();
    });

    it('should return null for empty denomination', () => {
      const result = detectUSCoinMetalContent('', 1964);
      expect(result).toBeNull();
    });

    it('should return null for modern silver dollar (after 1935)', () => {
      const result = detectUSCoinMetalContent('Dollar', 1971);
      expect(result).toBeNull();
    });

    it('should return null for dime outside year range', () => {
      const result = detectUSCoinMetalContent('Dime', 1891);
      expect(result).toBeNull();
    });
  });

  describe('getMatchingUSCoinRule', () => {
    it('should return the matching rule for debugging', () => {
      const rule = getMatchingUSCoinRule('Quarter', 1964);
      expect(rule).not.toBeNull();
      expect(rule!.denomination).toBe('quarter');
      expect(rule!.metalType).toBe('silver');
      expect(rule!.notes).toContain('Washington');
    });

    it('should return null when no rule matches', () => {
      const rule = getMatchingUSCoinRule('Quarter', 1965);
      expect(rule).toBeNull();
    });

    it('should distinguish between 90% and 40% half dollars', () => {
      const rule1964 = getMatchingUSCoinRule('Half Dollar', 1964);
      const rule1967 = getMatchingUSCoinRule('Half Dollar', 1967);

      expect(rule1964).not.toBeNull();
      expect(rule1967).not.toBeNull();
      expect(rule1964!.purity).toBe(0.9);
      expect(rule1967!.purity).toBe(0.4);
    });
  });

  describe('Rule data validation', () => {
    it('should have valid preciousMetalOz calculations for silver rules', () => {
      for (const rule of SILVER_COIN_RULES) {
        const expected = rule.totalWeightOz * rule.purity;
        const actual = rule.preciousMetalOz;
        // Allow 0.1% tolerance for US Mint's official published values
        expect(actual).toBeCloseTo(expected, 3);
      }
    });

    it('should have valid preciousMetalOz calculations for gold rules', () => {
      for (const rule of GOLD_COIN_RULES) {
        const expected = rule.totalWeightOz * rule.purity;
        const actual = rule.preciousMetalOz;
        // Allow 0.1% tolerance for US Mint's official published values
        expect(actual).toBeCloseTo(expected, 3);
      }
    });

    it('should have at least one alias for each rule', () => {
      for (const rule of [...SILVER_COIN_RULES, ...GOLD_COIN_RULES]) {
        expect(rule.aliases.length).toBeGreaterThan(0);
      }
    });

    it('should have valid year ranges (start <= end)', () => {
      for (const rule of [...SILVER_COIN_RULES, ...GOLD_COIN_RULES]) {
        expect(rule.yearRange.start).toBeLessThanOrEqual(rule.yearRange.end);
      }
    });
  });
});
