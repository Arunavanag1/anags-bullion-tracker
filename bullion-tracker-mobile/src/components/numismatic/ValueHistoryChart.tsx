import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { api } from '../../lib/api';
import type { ValueHistoryEntry } from '../../types';
import { formatCurrency } from '../../lib/calculations';

interface ValueHistoryChartProps {
  itemId: string;
  currentValue?: number;
}

/**
 * Displays value history for a collection item
 * Shows a simple text-based list of value changes over time
 *
 * @example
 * <ValueHistoryChart itemId="abc123" currentValue={150} />
 */
export function ValueHistoryChart({ itemId, currentValue }: ValueHistoryChartProps) {
  const [history, setHistory] = useState<ValueHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [itemId]);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getItemValueHistory(itemId, 30);
      setHistory(data);
    } catch (err) {
      setError('Failed to load price history');
      console.error('Failed to load value history:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading price history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No price history available</Text>
        <Text style={styles.emptySubtext}>
          Price history will be recorded when values are synced
        </Text>
      </View>
    );
  }

  // Calculate change from oldest to newest
  const firstEntry = history[history.length - 1];
  const lastEntry = history[0];
  const valueChange = lastEntry.value - firstEntry.value;
  const percentChange = firstEntry.value > 0
    ? ((valueChange / firstEntry.value) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Price History</Text>
        <Text style={styles.subtitle}>Last {history.length} entries</Text>
      </View>

      {/* Summary */}
      {history.length > 1 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(currentValue ?? lastEntry.value)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Change</Text>
            <Text style={[
              styles.summaryValue,
              valueChange > 0 ? styles.positiveChange : valueChange < 0 ? styles.negativeChange : undefined
            ]}>
              {valueChange >= 0 ? '+' : ''}{formatCurrency(valueChange)} ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
            </Text>
          </View>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.priceDate}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const prevEntry = history[index + 1];
          const change = prevEntry ? item.value - prevEntry.value : 0;

          return (
            <View style={styles.historyRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateText}>
                  {formatDate(item.priceDate)}
                </Text>
                {item.source && (
                  <Text style={styles.sourceText}>{item.source}</Text>
                )}
              </View>
              <View style={styles.valueColumn}>
                <Text style={styles.valueText}>
                  {formatCurrency(item.value)}
                </Text>
                {change !== 0 && (
                  <Text style={[
                    styles.changeText,
                    change > 0 ? styles.positiveChange : styles.negativeChange
                  ]}>
                    {change > 0 ? '+' : ''}{formatCurrency(change)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={styles.footerText}>
            Older entries not shown
          </Text>
        }
      />
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateColumn: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: '#374151',
  },
  sourceText: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  valueColumn: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  changeText: {
    fontSize: 11,
    marginTop: 2,
  },
  positiveChange: {
    color: '#22A06B',
  },
  negativeChange: {
    color: '#EF4444',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingTop: 12,
  },
});
