# Phase 59 Research: US Historical Coinage Rules Engine

## Research Goal

Document exact metal weights and compositions for US historical coins to implement automatic metal content detection in the bullion tracker app.

## Findings

### 1. Pre-1965 Silver Coinage (90% Silver)

All US silver coins minted before 1965 contain 90% silver (0.900 fine) and 10% copper.

| Denomination | Total Weight (g) | Total Weight (oz) | Silver Content (troy oz) |
|--------------|------------------|-------------------|--------------------------|
| Dime (1892-1964) | 2.50 | 0.0804 | 0.07234 |
| Quarter (1892-1964) | 6.25 | 0.2010 | 0.18084 |
| Half Dollar (1892-1964) | 12.50 | 0.4019 | 0.36169 |
| Silver Dollar (1878-1935) | 26.73 | 0.8594 | 0.77344 |

**Key Dates:**
- Barber series: 1892-1916 (dimes, quarters, half dollars)
- Mercury Dimes: 1916-1945
- Standing Liberty Quarters: 1916-1930
- Washington Quarters: 1932-1964
- Walking Liberty Half Dollars: 1916-1947
- Franklin Half Dollars: 1948-1963
- Kennedy Half Dollars: 1964 only (90% silver)
- Morgan Dollars: 1878-1921
- Peace Dollars: 1921-1935

### 2. Pre-1933 Gold Coinage (90% Gold)

All US gold coins contain 90% gold (0.900 fine) and 10% copper alloy.

| Denomination | Total Weight (g) | Total Weight (oz) | Gold Content (troy oz) |
|--------------|------------------|-------------------|------------------------|
| $1 Gold (Type 1, 1849-1854) | 1.672 | 0.05376 | 0.04837 |
| $1 Gold (Type 2-3, 1854-1889) | 1.672 | 0.05376 | 0.04837 |
| $2.50 Quarter Eagle | 4.180 | 0.13438 | 0.12094 |
| $3 Gold (1854-1889) | 5.015 | 0.16124 | 0.14512 |
| $5 Half Eagle | 8.359 | 0.26875 | 0.24187 |
| $10 Eagle | 16.718 | 0.53750 | 0.48375 |
| $20 Double Eagle | 33.436 | 1.07500 | 0.96750 |

**Key Dates:**
- $1 Gold: 1849-1889
- $2.50 Quarter Eagle: 1796-1929
- $3 Gold: 1854-1889
- $5 Half Eagle: 1795-1929
- $10 Eagle: 1795-1933
- $20 Double Eagle: 1849-1933

Note: Gold coins were recalled in 1933 (Executive Order 6102), but numismatic specimens remain legal to own.

### 3. Edge Cases

#### War Nickels (1942-1945)

During WWII, nickel was needed for the war effort. Jefferson nickels from mid-1942 to 1945 contain silver.

| Composition | Total Weight (g) | Total Weight (oz) | Silver Content (troy oz) |
|-------------|------------------|-------------------|--------------------------|
| 56% copper, 35% silver, 9% manganese | 5.00 | 0.16075 | 0.05626 |

**Identification:** Large mintmark (P, D, or S) above Monticello on reverse.
- 1942-P, 1942-D (only partial year)
- 1943-P, 1943-D, 1943-S
- 1944-P, 1944-D, 1944-S
- 1945-P, 1945-D, 1945-S

#### 40% Silver Kennedy Half Dollars (1965-1970)

| Composition | Total Weight (g) | Total Weight (oz) | Silver Content (troy oz) |
|-------------|------------------|-------------------|--------------------------|
| 40% silver, 60% copper | 11.50 | 0.36975 | 0.14792 |

**Key Dates:** 1965, 1966, 1967, 1968-D, 1969-D, 1970-D

Note: 1970-D was only issued in mint sets, making it scarcer.

#### Eisenhower Dollars (1971-1976)

| Type | Composition | Silver Content |
|------|-------------|----------------|
| Business strikes | Copper-nickel clad | None |
| 40% silver proofs/uncirculated (S mint) | 40% silver | 0.3161 troy oz |

### 4. Detection Rules Summary

For the rules engine, we need to detect coins based on:

1. **Denomination** - dime, quarter, half dollar, dollar, $1 gold, $2.50, $3, $5, $10, $20
2. **Year** - determines composition
3. **Mint mark** - for war nickels (P, D, S above Monticello)

#### Silver Detection Rules:

```
IF denomination IN (dime, quarter, half dollar) AND year <= 1964:
  → 90% silver, use standard weights

IF denomination = "dollar" AND year >= 1878 AND year <= 1935:
  → 90% silver Morgan/Peace dollar

IF denomination = "half dollar" AND year >= 1965 AND year <= 1970:
  → 40% silver Kennedy

IF denomination = "nickel" AND year >= 1942 AND year <= 1945:
  → Check for large mintmark (war nickel), 35% silver
```

#### Gold Detection Rules:

```
IF denomination IN ($1 gold, $2.50, $3, $5, $10, $20) AND year <= 1933:
  → 90% gold, use standard weights by denomination
```

### 5. Implementation Considerations

1. **Year Range Validation**: The rules engine should validate year ranges:
   - No US silver coins after 1970 (except collector issues)
   - No gold coins in circulation after 1933

2. **Title/Description Parsing**: Need to extract denomination and year from coin title or reference data. Common patterns:
   - "1923 Peace Dollar"
   - "1964 Kennedy Half Dollar"
   - "1928 $20 Saint-Gaudens"

3. **PCGS/NGC Data Integration**: Phase 60 will use cert lookup to get specifications. This phase focuses on automatic detection without cert data.

4. **Fallback Hierarchy**:
   1. Cert lookup data (Phase 60)
   2. US historical rules (this phase)
   3. Manual input (Phase 61)

### 6. Data Structure for Rules

```typescript
interface USCoinRule {
  denomination: string;
  aliases: string[];  // Alternative names
  yearRange: { start: number; end: number };
  metalType: 'gold' | 'silver';
  purity: number;  // 0.0-1.0
  totalWeightOz: number;
  preciousMetalOz: number;
  notes?: string;
}
```

### 7. Sources

- US Mint: https://www.usmint.gov/learn/coin-and-medal-programs
- PCGS CoinFacts: https://www.pcgs.com/coinfacts
- NGC Coin Explorer: https://www.ngccoin.com/coin-explorer
- Coinage Act of 1873 (silver dollar specifications)
- Gold Reserve Act of 1934 (gold recall)

---

*Research completed: 2026-01-24*
*Phase: 59-us-historical-coinage-rules*
