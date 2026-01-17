import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChartContainer } from './ChartContainer';
import { Colors } from '../../lib/colors';
import type { CollectionItem } from '../../lib/api';

interface GainLossBarChartProps {
  collection: CollectionItem[];
  spotPrices: {
    gold: number;
    silver: number;
    platinum: number;
  };
}

interface MetalGainLoss {
  name: string;
  gainLoss: number;
  percentChange: number;
  currentValue: number;
  costBasis: number;
  color: string;
}

const POSITIVE_COLOR = Colors.positive;
const NEGATIVE_COLOR = Colors.negative;

export function GainLossBarChart({ collection, spotPrices }: GainLossBarChartProps) {
  const { chartData, totals } = useMemo(() => {
    if (!collection || collection.length === 0) {
      return {
        chartData: [],
        totals: { gainLoss: 0, percentChange: 0, currentValue: 0, costBasis: 0 },
      };
    }

    const metalTotals: Record<string, { currentValue: number; costBasis: number }> = {
      gold: { currentValue: 0, costBasis: 0 },
      silver: { currentValue: 0, costBasis: 0 },
      platinum: { currentValue: 0, costBasis: 0 },
    };

    collection.forEach((item) => {
      const metal = item.metal as 'gold' | 'silver' | 'platinum';
      if (!metal || !spotPrices[metal]) return;

      const spotPrice = spotPrices[metal];
      const weightOz = item.weightOz || 0;
      const currentValue = weightOz * spotPrice;
      const costBasis = item.purchasePrice || 0;

      metalTotals[metal].currentValue += currentValue;
      metalTotals[metal].costBasis += costBasis;
    });

    const data: MetalGainLoss[] = Object.entries(metalTotals)
      .filter(([, values]) => values.currentValue > 0 || values.costBasis > 0)
      .map(([metal, values]) => {
        const gainLoss = values.currentValue - values.costBasis;
        const percentChange = values.costBasis > 0
          ? ((values.currentValue - values.costBasis) / values.costBasis) * 100
          : 0;

        return {
          name: metal.charAt(0).toUpperCase() + metal.slice(1),
          gainLoss,
          percentChange,
          currentValue: values.currentValue,
          costBasis: values.costBasis,
          color: gainLoss >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR,
        };
      })
      .sort((a, b) => b.gainLoss - a.gainLoss);

    const totalCurrentValue = data.reduce((sum, d) => sum + d.currentValue, 0);
    const totalCostBasis = data.reduce((sum, d) => sum + d.costBasis, 0);
    const totalGainLoss = totalCurrentValue - totalCostBasis;
    const totalPercentChange = totalCostBasis > 0
      ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100
      : 0;

    return {
      chartData: data,
      totals: {
        gainLoss: totalGainLoss,
        percentChange: totalPercentChange,
        currentValue: totalCurrentValue,
        costBasis: totalCostBasis,
      },
    };
  }, [collection, spotPrices]);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (!collection || collection.length === 0) {
    return (
      <ChartContainer title="Gain / Loss by Metal" height={150}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Add items to see gain/loss</Text>
        </View>
      </ChartContainer>
    );
  }

  // Calculate max for scaling bars
  const maxAbsValue = Math.max(...chartData.map(d => Math.abs(d.gainLoss)), 1);

  const isOverallPositive = totals.gainLoss >= 0;

  return (
    <View>
      <ChartContainer title="Gain / Loss by Metal" height={chartData.length * 50 + 20}>
        <View style={styles.barsContainer}>
          {chartData.map((item) => {
            const barWidth = Math.max((Math.abs(item.gainLoss) / maxAbsValue) * 100, 5);
            const isPositive = item.gainLoss >= 0;

            return (
              <View key={item.name} style={styles.barRow}>
                <Text style={styles.metalLabel}>{item.name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: item.color,
                        alignSelf: isPositive ? 'flex-start' : 'flex-end',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.valueLabel, { color: item.color }]}>
                  {isPositive ? '+' : ''}{formatCurrency(item.gainLoss)}
                </Text>
              </View>
            );
          })}
        </View>
      </ChartContainer>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Total Portfolio</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totals.currentValue)}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>Overall {isOverallPositive ? 'Gain' : 'Loss'}</Text>
          <Text style={[styles.summaryGainLoss, { color: isOverallPositive ? POSITIVE_COLOR : NEGATIVE_COLOR }]}>
            {isOverallPositive ? '+' : ''}{formatCurrency(totals.gainLoss)}
          </Text>
          <Text style={[styles.summaryPercent, { color: isOverallPositive ? POSITIVE_COLOR : NEGATIVE_COLOR }]}>
            {formatPercent(totals.percentChange)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metalLabel: {
    width: 70,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  barTrack: {
    flex: 1,
    height: 24,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  valueLabel: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryLeft: {},
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryGainLoss: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryPercent: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
