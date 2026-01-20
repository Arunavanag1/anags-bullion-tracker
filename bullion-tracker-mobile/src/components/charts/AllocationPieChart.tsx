import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { ChartContainer } from './ChartContainer';
import { Colors } from '../../lib/colors';
import type { CollectionItem } from '../../lib/api';

type ViewMode = 'metal' | 'category';

interface AllocationPieChartProps {
  collection: CollectionItem[];
  spotPrices: {
    gold: number;
    silver: number;
    platinum: number;
  };
  totalPortfolioValue?: number;
}

interface PieDataItem {
  label: string;
  value: number;
  color: string;
  percentage: number;
  [key: string]: unknown;
}

const METAL_COLORS: Record<string, string> = {
  Gold: Colors.gold,
  Silver: Colors.silver,
  Platinum: Colors.platinum,
};

const CATEGORY_COLORS: Record<string, string> = {
  Bullion: Colors.gold,
  Numismatic: '#4F46E5',
};

export function AllocationPieChart({ collection, spotPrices, totalPortfolioValue }: AllocationPieChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('metal');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const { chartData, totalValue } = useMemo(() => {
    if (!collection || collection.length === 0) {
      return { chartData: [], totalValue: 0 };
    }

    const totals: Record<string, number> = {};
    let total = 0;

    collection.forEach((item) => {
      const metal = item.metal as 'gold' | 'silver' | 'platinum';
      if (!metal || !spotPrices[metal]) return;

      const spotPrice = spotPrices[metal];
      const weightOz = item.weightOz || 0;
      const value = weightOz * spotPrice;

      if (viewMode === 'metal') {
        const metalName = metal.charAt(0).toUpperCase() + metal.slice(1);
        totals[metalName] = (totals[metalName] || 0) + value;
      } else {
        const category = item.category === 'NUMISMATIC' ? 'Numismatic' : 'Bullion';
        totals[category] = (totals[category] || 0) + value;
      }

      total += value;
    });

    const colors = viewMode === 'metal' ? METAL_COLORS : CATEGORY_COLORS;

    const data: PieDataItem[] = Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        label: name,
        value,
        color: colors[name] || Colors.textSecondary,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { chartData: data, totalValue: total };
  }, [collection, spotPrices, viewMode]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (!collection || collection.length === 0) {
    return (
      <ChartContainer title="Portfolio Allocation" height={200}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Add items to see allocation</Text>
        </View>
      </ChartContainer>
    );
  }

  return (
    <View>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'metal' && styles.toggleButtonActive]}
          onPress={() => setViewMode('metal')}
        >
          <Text style={[styles.toggleText, viewMode === 'metal' && styles.toggleTextActive]}>
            By Metal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'category' && styles.toggleButtonActive]}
          onPress={() => setViewMode('category')}
        >
          <Text style={[styles.toggleText, viewMode === 'category' && styles.toggleTextActive]}>
            By Category
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <ChartContainer title="Portfolio Allocation" height={200}>
        {chartData.length > 0 ? (
          <View style={styles.chartWrapper}>
            <PolarChart
              data={chartData}
              labelKey="label"
              valueKey="value"
              colorKey="color"
            >
              <Pie.Chart innerRadius={50} />
            </PolarChart>
            {/* Center Label */}
            <View style={styles.centerLabel}>
              <Text style={styles.centerLabelSmall}>Total</Text>
              <Text style={styles.centerLabelValue}>{formatCurrency(totalPortfolioValue ?? totalValue)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No allocation data</Text>
          </View>
        )}
      </ChartContainer>

      {/* Legend - Interactive */}
      {chartData.length > 0 && (
        <View style={styles.legend}>
          {chartData.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.legendItem,
                selectedSegment === item.label && styles.legendItemSelected,
              ]}
              onPress={() => setSelectedSegment(
                selectedSegment === item.label ? null : item.label
              )}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[
                styles.legendText,
                selectedSegment === item.label && styles.legendTextSelected,
              ]}>
                {item.label} ({item.percentage.toFixed(1)}%)
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Detail Card - shown when segment selected */}
      {selectedSegment && chartData.length > 0 && (
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>{selectedSegment}</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(chartData.find(d => d.label === selectedSegment)?.value || 0)}
          </Text>
          <Text style={styles.detailPercent}>
            {chartData.find(d => d.label === selectedSegment)?.percentage.toFixed(1)}% of portfolio
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.bgCard,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },
  chartWrapper: {
    flex: 1,
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabelSmall: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  centerLabelValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legendItemSelected: {
    backgroundColor: Colors.bgCard,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  legendTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detailPercent: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
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
