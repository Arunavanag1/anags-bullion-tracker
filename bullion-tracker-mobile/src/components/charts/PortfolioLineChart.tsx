import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { ChartContainer } from './ChartContainer';
import { ChartTheme } from '../../lib/chartTheme';
import { Colors } from '../../lib/colors';
import { api } from '../../lib/api';
import type { HistoricalPoint } from '../../types';

type TimeRange = '1W' | '1M' | '1Y' | '5Y';

const TIME_RANGES: { value: TimeRange; label: string; days: number }[] = [
  { value: '1W', label: '1W', days: 7 },
  { value: '1M', label: '1M', days: 30 },
  { value: '1Y', label: '1Y', days: 365 },
  { value: '5Y', label: '5Y', days: 1825 },
];

interface ChartDataPoint {
  x: number;
  totalValue: number;
  date: string;
  [key: string]: unknown;
}

export function PortfolioLineChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const range = TIME_RANGES.find(r => r.value === timeRange);
      const history = await api.getPortfolioHistory(range?.days || 30);
      // Transform to chart format with x as index
      setData(history.map((p: HistoricalPoint, i: number) => ({
        x: i,
        totalValue: p.totalValue,
        date: p.date,
      })));
    } catch (err) {
      setError('Failed to load chart data');
      console.error('Portfolio chart error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate change stats
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const change = lastPoint && firstPoint ? lastPoint.totalValue - firstPoint.totalValue : 0;
  const changePercent = firstPoint?.totalValue > 0
    ? ((change / firstPoint.totalValue) * 100).toFixed(2)
    : '0.00';
  const isPositive = change >= 0;

  return (
    <View>
      {/* Time Range Selector */}
      <View style={styles.rangeContainer}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.rangeButton,
              timeRange === range.value && styles.rangeButtonActive,
            ]}
            onPress={() => setTimeRange(range.value)}
          >
            <Text style={[
              styles.rangeText,
              timeRange === range.value && styles.rangeTextActive,
            ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <ChartContainer title="Portfolio Value" height={200} loading={loading}>
        {data.length > 0 && !error ? (
          <CartesianChart
            data={data}
            xKey="x"
            yKeys={['totalValue']}
            domainPadding={{ top: 20, bottom: 20, left: 10, right: 10 }}
          >
            {({ points }) => (
              <Line
                points={points.totalValue}
                color={ChartTheme.colors.gold}
                strokeWidth={2.5}
                animate={ChartTheme.animation}
                curveType="natural"
              />
            )}
          </CartesianChart>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !loading ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No data available</Text>
          </View>
        ) : null}
      </ChartContainer>

      {/* Summary Stats */}
      {data.length > 0 && !loading && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Start</Text>
              <Text style={styles.statValue}>
                ${firstPoint?.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={[styles.stat, styles.statRight]}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={[styles.statValue, { color: Colors.accentTeal }]}>
                ${lastPoint?.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
          <View style={styles.changeRow}>
            <Text style={styles.changeLabel}>Change ({timeRange})</Text>
            <Text style={[styles.changeValue, { color: isPositive ? Colors.positive : Colors.negative }]}>
              {isPositive ? '+' : ''}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({isPositive ? '+' : ''}{changePercent}%)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rangeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  rangeButtonActive: {
    backgroundColor: Colors.bgCard,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rangeTextActive: {
    color: Colors.textPrimary,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  changeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
