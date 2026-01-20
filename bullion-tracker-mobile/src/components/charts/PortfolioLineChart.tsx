import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
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

interface PortfolioLineChartProps {
  currentPortfolioValue?: number;
}

export function PortfolioLineChart({ currentPortfolioValue }: PortfolioLineChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Chart press state for tooltip - victory-native handles the SharedValue internally
  const { state, isActive } = useChartPressState({ x: 0, y: { totalValue: 0 } });

  // Sync the SharedValue x index to React state for tooltip display
  useAnimatedReaction(
    () => Math.round(state.x.value.value),
    (currentIndex, previousIndex) => {
      if (currentIndex !== previousIndex) {
        runOnJS(setActivePointIndex)(currentIndex);
      }
    },
    [state.x.value]
  );

  // Get the active point data for tooltip
  const activePoint = activePointIndex !== null && data[activePointIndex]
    ? data[activePointIndex]
    : null;

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setActivePointIndex(null);
    try {
      const range = TIME_RANGES.find(r => r.value === timeRange);
      const history = await api.getPortfolioHistory(range?.days || 30);
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

  // Calculate change stats - use currentPortfolioValue if provided, otherwise fall back to last data point
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const displayCurrentValue = currentPortfolioValue ?? lastPoint?.totalValue ?? 0;
  const change = firstPoint ? displayCurrentValue - firstPoint.totalValue : 0;
  const changePercent = firstPoint?.totalValue > 0
    ? ((change / firstPoint.totalValue) * 100).toFixed(2)
    : '0.00';
  const isPositive = change >= 0;

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

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
          <View style={styles.chartWrapper}>
            <CartesianChart
              data={data}
              xKey="x"
              yKeys={['totalValue']}
              domainPadding={{ top: 20, bottom: 20, left: 10, right: 10 }}
              chartPressState={state}
            >
              {({ points }) => (
                <>
                  <Line
                    points={points.totalValue}
                    color={ChartTheme.colors.gold}
                    strokeWidth={2.5}
                    animate={ChartTheme.animation}
                    curveType="natural"
                  />
                  {/* Touch indicator dot - rendered via Skia */}
                  <Circle
                    cx={state.x.position}
                    cy={state.y.totalValue.position}
                    r={8}
                    color={ChartTheme.colors.gold}
                    opacity={isActive ? 1 : 0}
                  />
                </>
              )}
            </CartesianChart>
            {/* Tooltip showing date and value */}
            {isActive && activePoint && (
              <View style={styles.tooltipCard}>
                <Text style={styles.tooltipDate}>{activePoint.date}</Text>
                <Text style={styles.tooltipValue}>
                  ${activePoint.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            )}
          </View>
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
                ${displayCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
  chartWrapper: {
    flex: 1,
    position: 'relative',
  },
  tooltipCard: {
    position: 'absolute',
    top: 8,
    left: 16,
    backgroundColor: Colors.accentDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tooltipDate: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  tooltipValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
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
