import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Colors } from '../lib/colors';
import { api } from '../lib/api';

interface MetalPerformance {
  metal: 'gold' | 'silver' | 'platinum';
  currentPrice: number;
  priceOneMonthAgo: number;
  change: number;
  changePercent: number;
}

interface CoinPerformance {
  id: string;
  title: string;
  grade: string;
  coinReferenceId: string;
  currentPrice: number;
  priceOneMonthAgo: number;
  change: number;
  changePercent: number;
  priceSource: string;
}

interface MetalPerformanceResponse {
  metals: MetalPerformance[];
  bestPerformer: MetalPerformance;
  worstPerformer: MetalPerformance;
  periodDays: number;
}

interface CoinPerformanceResponse {
  coins: CoinPerformance[];
  bestPerformer: CoinPerformance | null;
  worstPerformer: CoinPerformance | null;
  periodDays: number;
}

const METAL_LABELS: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  platinum: 'Platinum',
};

const METAL_COLORS: Record<string, string> = {
  gold: Colors.gold,
  silver: Colors.silver,
  platinum: Colors.platinum,
};

export function TopPerformers() {
  const [metalData, setMetalData] = useState<MetalPerformanceResponse | null>(null);
  const [coinData, setCoinData] = useState<CoinPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [metals, coins] = await Promise.all([
        api.getMetalPerformance(),
        api.getCoinPerformance(),
      ]);
      setMetalData(metals);
      setCoinData(coins);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Text style={styles.title}>Top Performers (30 Days)</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.accentTeal} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.title}>Top Performers (30 Days)</Text>

      {/* Metals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>METALS</Text>

        {metalData?.bestPerformer && (
          <PerformanceRow
            label={METAL_LABELS[metalData.bestPerformer.metal]}
            color={METAL_COLORS[metalData.bestPerformer.metal]}
            changePercent={metalData.bestPerformer.changePercent}
            priceFrom={metalData.bestPerformer.priceOneMonthAgo}
            priceTo={metalData.bestPerformer.currentPrice}
            type="best"
          />
        )}

        {metalData?.worstPerformer &&
         metalData.bestPerformer?.metal !== metalData.worstPerformer.metal && (
          <PerformanceRow
            label={METAL_LABELS[metalData.worstPerformer.metal]}
            color={METAL_COLORS[metalData.worstPerformer.metal]}
            changePercent={metalData.worstPerformer.changePercent}
            priceFrom={metalData.worstPerformer.priceOneMonthAgo}
            priceTo={metalData.worstPerformer.currentPrice}
            type="worst"
          />
        )}
      </View>

      {/* Coins Section - Coming Soon */}
      <View style={[styles.section, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>YOUR COINS</Text>
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonText}>Coming soon</Text>
        </View>
      </View>
    </Card>
  );
}

interface PerformanceRowProps {
  label: string;
  color: string;
  changePercent: number;
  priceFrom: number;
  priceTo: number;
  type: 'best' | 'worst';
}

function PerformanceRow({ label, color, changePercent, priceFrom, priceTo, type }: PerformanceRowProps) {
  const isPositive = changePercent >= 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.typeLabel}>{type === 'best' ? 'Best' : 'Worst'}</Text>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.metalLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.priceRange}>
          ${priceFrom.toFixed(2)} → ${priceTo.toFixed(2)}
        </Text>
        <Text style={[styles.percentChange, { color: isPositive ? Colors.positive : Colors.negative }]}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}

interface CoinPerformanceRowProps {
  title: string;
  grade: string;
  changePercent: number;
  priceFrom: number;
  priceTo: number;
  type: 'best' | 'worst';
}

function CoinPerformanceRow({ title, grade, changePercent, priceFrom, priceTo, type }: CoinPerformanceRowProps) {
  const isPositive = changePercent >= 0;
  const displayTitle = title.length > 25 ? title.substring(0, 22) + '...' : title;

  return (
    <View style={styles.coinRow}>
      <View style={styles.coinRowTop}>
        <View style={styles.rowLeft}>
          <Text style={styles.typeLabel}>{type === 'best' ? 'Best' : 'Worst'}</Text>
          <Text style={styles.coinTitle}>{displayTitle}</Text>
        </View>
        <Text style={[styles.percentChange, { color: isPositive ? Colors.positive : Colors.negative }]}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </Text>
      </View>
      <View style={styles.coinRowBottom}>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
        <Text style={styles.coinPriceRange}>
          ${priceFrom.toLocaleString()} → ${priceTo.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  section: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  priceRange: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
  percentChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  coinRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coinRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  coinTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  coinRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeBadge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  coinPriceRange: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
  sourceText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  comingSoonContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
});
