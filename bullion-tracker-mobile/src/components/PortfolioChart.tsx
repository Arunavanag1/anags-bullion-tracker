import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { generateDailyPrices } from '../lib/historical-data';
import { calculateMeltValue, calculateBookValue } from '../lib/calculations';
import { Colors } from '../lib/colors';
import type { TimeRange, HistoricalPoint, CollectionItem } from '../types';

const TIME_RANGES: { value: TimeRange; label: string; days: number }[] = [
  { value: '1W', label: '1W', days: 7 },
  { value: '1M', label: '1M', days: 30 },
  { value: '1Y', label: '1Y', days: 365 },
  { value: '5Y', label: '5Y', days: 365 * 5 },
];

interface PortfolioChartProps {
  items: CollectionItem[];
}

export function PortfolioChart({ items }: PortfolioChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartData, setChartData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadChartData();
  }, [timeRange, items]);

  const loadChartData = async () => {
    setLoading(true);
    try {

      if (items.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const selectedRange = TIME_RANGES.find(r => r.value === timeRange);
      const days = selectedRange?.days || 30;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Determine interval based on range
      const interval = days > 365 ? 7 : days > 30 ? 3 : 1;

      const historicalPrices = generateDailyPrices(startDate, endDate, interval);

      const portfolioHistory: HistoricalPoint[] = historicalPrices.map((pricePoint) => {
        let meltValue = 0;
        let bookValue = 0;

        items.forEach((item) => {
          const metalKey = item.metal as 'gold' | 'silver' | 'platinum';
          if (!metalKey) return;
          const spotPrice = pricePoint[metalKey];
          meltValue += calculateMeltValue(item, spotPrice);
          bookValue += calculateBookValue(item, spotPrice);
        });

        return {
          date: formatDate(pricePoint.timestamp, timeRange),
          meltValue: Math.round(meltValue * 100) / 100,
          bookValue: Math.round(bookValue * 100) / 100,
          timestamp: pricePoint.timestamp.getTime(),
        };
      });

      setChartData(portfolioHistory);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accentTeal} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading chart...</Text>
        </View>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 }}>
          Portfolio Value Over Time
        </Text>
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>
            Add items to your collection to see portfolio value over time
          </Text>
        </View>
      </Card>
    );
  }

  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const meltChange = lastPoint.meltValue - firstPoint.meltValue;
  const meltChangePercent = firstPoint.meltValue > 0
    ? ((meltChange / firstPoint.meltValue) * 100).toFixed(2)
    : '0.00';

  return (
    <Card>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 }}>
              Portfolio Value Over Time
            </Text>
            {!expanded && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                  {timeRange} Change:
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: meltChange >= 0 ? Colors.positive : Colors.negative
                }}>
                  {meltChange >= 0 ? '+' : ''}{meltChangePercent}%
                </Text>
              </View>
            )}
          </View>
          <View style={{
            backgroundColor: expanded ? Colors.accentTeal : Colors.bgSecondary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: expanded ? '#FFFFFF' : Colors.textSecondary
            }}>
              {expanded ? 'Collapse' : 'Expand'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 12 }}>
            Historical melt vs book value
          </Text>

      {/* Time Range Selector */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            size="sm"
            variant={timeRange === range.value ? 'primary' : 'ghost'}
            onPress={() => setTimeRange(range.value)}
            style={{ flex: 1 }}
          >
            {range.label}
          </Button>
        ))}
      </View>

          {/* Summary Stats */}
          <View style={{
            backgroundColor: Colors.bgSecondary,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>
                  Starting Value
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>
                  ${firstPoint.meltValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>
                  Current Value
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.accentTeal }}>
                  ${lastPoint.meltValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
            <View style={{
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              paddingTop: 12,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                Change ({timeRange})
              </Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: meltChange >= 0 ? Colors.positive : Colors.negative
              }}>
                {meltChange >= 0 ? '+' : ''}${meltChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({meltChange >= 0 ? '+' : ''}{meltChangePercent}%)
              </Text>
            </View>
          </View>

          {/* Data Points Summary - Commented out since graph is not displayed on mobile */}
          {/* <View style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 8,
            padding: 12
          }}>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 8 }}>
              Data Points: {chartData.length}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 16, height: 3, backgroundColor: Colors.accentAmber, borderRadius: 2 }} />
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Melt Value</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{
                  width: 16,
                  height: 3,
                  backgroundColor: Colors.negative,
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  borderWidth: 1,
                  borderColor: Colors.negative
                }} />
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Book Value</Text>
              </View>
            </View>
          </View> */}

          {/* Note */}
          <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 12, textAlign: 'center', opacity: 0.7 }}>
            Historical prices from curated database (2020-2025).{'\n'}
            Values reflect current holdings at historical market prices.{'\n'}
            Full chart visualization available in web app.
          </Text>
        </View>
      )}
    </Card>
  );
}

function formatDate(date: Date, timeRange: TimeRange): string {
  if (timeRange === '1W' || timeRange === '1M') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (timeRange === '1Y') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { year: 'numeric' });
  }
}
