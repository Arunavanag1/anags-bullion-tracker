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

export function AllocationPieChart({ collection, spotPrices }: AllocationPieChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('metal');

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
              <Text style={styles.centerLabelValue}>{formatCurrency(totalValue)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No allocation data</Text>
          </View>
        )}
      </ChartContainer>

      {/* Legend */}
      {chartData.length > 0 && (
        <View style={styles.legend}>
          {chartData.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.label} ({item.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
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
