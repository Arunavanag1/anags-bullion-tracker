import { describe, it, expect } from 'vitest';
import { detectUSCoinMetalContent } from '../us-coinage-rules';

/**
 * Test integration between cert lookup and metal content detection.
 *
 * These tests validate that PCGS denomination formats (10C, 25C, 50C, $1, etc.)
 * work correctly with the US coinage rules engine when used in cert lookup responses.
 */
describe('Cert Lookup Metal Content Integration', () => {
  describe('PCGS denomination format compatibility', () => {
    it('should handle PCGS dime format (10C) with 1964 silver', () => {
      const result = detectUSCoinMetalContent('10C', 1964);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.metalWeightOz).toBe(0.0804);
      expect(result!.preciousMetalOz).toBe(0.07234);
    });

    it('should handle PCGS quarter format (25C) with 1932 silver', () => {
      const result = detectUSCoinMetalContent('25C', 1932);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.metalWeightOz).toBe(0.201);
      expect(result!.preciousMetalOz).toBe(0.18084);
    });

    it('should handle PCGS half dollar format (50C) with 1964 silver', () => {
      const result = detectUSCoinMetalContent('50C', 1964);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.36169);
    });

    it('should handle PCGS dollar format ($1) with 1923 Peace dollar', () => {
      const result = detectUSCoinMetalContent('$1', 1923);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.77344);
    });

    it('should handle PCGS gold format ($20) with 1928 Saint-Gaudens', () => {
      const result = detectUSCoinMetalContent('$20', 1928);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.metalWeightOz).toBe(1.075);
      expect(result!.preciousMetalOz).toBe(0.9675);
    });

    it('should handle PCGS $10 Eagle format with 1907', () => {
      const result = detectUSCoinMetalContent('$10', 1907);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.48375);
    });

    it('should handle PCGS $5 Half Eagle format with 1900', () => {
      const result = detectUSCoinMetalContent('$5', 1900);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.9);
      expect(result!.preciousMetalOz).toBe(0.24187);
    });

    it('should handle PCGS nickel format (5C) for war nickel 1943', () => {
      const result = detectUSCoinMetalContent('5C', 1943);
      expect(result).not.toBeNull();
      expect(result!.metalPurity).toBe(0.35);
      expect(result!.preciousMetalOz).toBe(0.05626);
    });
  });

  describe('Clad/modern coins return null', () => {
    it('should return null for clad quarter (25C) after 1964', () => {
      const result = detectUSCoinMetalContent('25C', 1965);
      expect(result).toBeNull();
    });

    it('should return null for clad dime (10C) after 1964', () => {
      const result = detectUSCoinMetalContent('10C', 1965);
      expect(result).toBeNull();
    });

    it('should return null for clad half dollar (50C) after 1970', () => {
      const result = detectUSCoinMetalContent('50C', 1971);
      expect(result).toBeNull();
    });

    it('should return null for modern dollar ($1) after 1935', () => {
      const result = detectUSCoinMetalContent('$1', 1971);
      expect(result).toBeNull();
    });

    it('should return null for post-war nickel (5C)', () => {
      const result = detectUSCoinMetalContent('5C', 1946);
      expect(result).toBeNull();
    });
  });

  describe('Transitional period coins', () => {
    it('should detect 40% silver Kennedy (50C) 1965-1970', () => {
      const result1965 = detectUSCoinMetalContent('50C', 1965);
      const result1970 = detectUSCoinMetalContent('50C', 1970);

      expect(result1965).not.toBeNull();
      expect(result1965!.metalPurity).toBe(0.4);
      expect(result1970).not.toBeNull();
      expect(result1970!.metalPurity).toBe(0.4);
    });

    it('should distinguish 90% vs 40% Kennedy halves', () => {
      const result1964 = detectUSCoinMetalContent('50C', 1964);
      const result1967 = detectUSCoinMetalContent('50C', 1967);

      expect(result1964!.metalPurity).toBe(0.9);
      expect(result1964!.preciousMetalOz).toBe(0.36169);

      expect(result1967!.metalPurity).toBe(0.4);
      expect(result1967!.preciousMetalOz).toBe(0.14792);
    });
  });

  describe('Expected API response structure', () => {
    it('should return all three metal content fields', () => {
      const result = detectUSCoinMetalContent('25C', 1964);

      expect(result).toHaveProperty('metalPurity');
      expect(result).toHaveProperty('metalWeightOz');
      expect(result).toHaveProperty('preciousMetalOz');

      expect(typeof result!.metalPurity).toBe('number');
      expect(typeof result!.metalWeightOz).toBe('number');
      expect(typeof result!.preciousMetalOz).toBe('number');
    });

    it('should return null (not undefined) for unrecognized coins', () => {
      const result = detectUSCoinMetalContent('1C', 1964);
      expect(result).toBeNull();
    });
  });
});
