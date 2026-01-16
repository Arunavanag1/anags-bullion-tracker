import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../lib/colors';
import { getPriceForDate } from '../../lib/historical-data';
import type { SpotPrices } from '../../types';

interface SpotPriceBannerProps {
  spotPrices: SpotPrices | null;
}

interface MetalRowProps {
  symbol: string;
  name: string;
  color: string;
  currentPrice: number;
  yesterdayPrice: number;
}

function MetalRow({ symbol, name, color, currentPrice, yesterdayPrice }: MetalRowProps) {
  const change = currentPrice - yesterdayPrice;
  const changePercent = yesterdayPrice > 0 ? (change / yesterdayPrice) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <View style={styles.metalRow}>
      <View style={styles.metalInfo}>
        <Text style={[styles.metalSymbol, { color }]}>{symbol}</Text>
        <Text style={styles.metalName}>{name}</Text>
      </View>
      <View style={styles.priceInfo}>
        <Text style={styles.currentPrice}>${currentPrice.toLocaleString()}/oz</Text>
        <Text style={[styles.changeText, { color: isPositive ? Colors.positive : Colors.negative }]}>
          {isPositive ? '+' : ''}{change >= 1 || change <= -1 ? `$${Math.abs(change).toFixed(0)}` : `$${Math.abs(change).toFixed(2)}`} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </Text>
      </View>
    </View>
  );
}

export function SpotPriceBanner({ spotPrices }: SpotPriceBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!spotPrices) {
    return null;
  }

  // Get yesterday's prices
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayPrices = getPriceForDate(yesterday);

  const goldChange = spotPrices.gold - yesterdayPrices.gold;
  const silverChange = spotPrices.silver - yesterdayPrices.silver;
  const platinumChange = spotPrices.platinum - yesterdayPrices.platinum;

  const goldChangePercent = yesterdayPrices.gold > 0 ? (goldChange / yesterdayPrices.gold) * 100 : 0;
  const silverChangePercent = yesterdayPrices.silver > 0 ? (silverChange / yesterdayPrices.silver) * 100 : 0;
  const platinumChangePercent = yesterdayPrices.platinum > 0 ? (platinumChange / yesterdayPrices.platinum) * 100 : 0;

  return (
    <LinearGradient
      colors={[Colors.bannerGradientStart, Colors.bannerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        {/* Collapsed View - Compact Pills */}
        <View style={styles.collapsedContainer}>
          <View style={styles.pricePill}>
            <Text style={[styles.pillSymbol, { color: Colors.gold }]}>Au</Text>
            <Text style={styles.pillPrice}>${spotPrices.gold.toLocaleString()}</Text>
            <Text style={[styles.pillChange, { color: goldChange >= 0 ? Colors.positive : Colors.negative }]}>
              {goldChange >= 0 ? '▲' : '▼'}
            </Text>
          </View>
          <View style={styles.pricePill}>
            <Text style={[styles.pillSymbol, { color: Colors.silver }]}>Ag</Text>
            <Text style={styles.pillPrice}>${spotPrices.silver.toLocaleString()}</Text>
            <Text style={[styles.pillChange, { color: silverChange >= 0 ? Colors.positive : Colors.negative }]}>
              {silverChange >= 0 ? '▲' : '▼'}
            </Text>
          </View>
          <View style={styles.pricePill}>
            <Text style={[styles.pillSymbol, { color: Colors.platinum }]}>Pt</Text>
            <Text style={styles.pillPrice}>${spotPrices.platinum.toLocaleString()}</Text>
            <Text style={[styles.pillChange, { color: platinumChange >= 0 ? Colors.positive : Colors.negative }]}>
              {platinumChange >= 0 ? '▲' : '▼'}
            </Text>
          </View>
          <Text style={styles.expandHint}>{expanded ? '▲' : '▼'}</Text>
        </View>

        {/* Expanded View - Full Details */}
        {expanded && (
          <View style={styles.expandedContainer}>
            <Text style={styles.expandedTitle}>24h Price Change</Text>
            <MetalRow
              symbol="Au"
              name="Gold"
              color={Colors.gold}
              currentPrice={spotPrices.gold}
              yesterdayPrice={yesterdayPrices.gold}
            />
            <MetalRow
              symbol="Ag"
              name="Silver"
              color={Colors.silver}
              currentPrice={spotPrices.silver}
              yesterdayPrice={yesterdayPrices.silver}
            />
            <MetalRow
              symbol="Pt"
              name="Platinum"
              color={Colors.platinum}
              currentPrice={spotPrices.platinum}
              yesterdayPrice={yesterdayPrices.platinum}
            />
          </View>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  collapsedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillSymbol: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },
  pillPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pillChange: {
    fontSize: 10,
    fontWeight: '600',
  },
  expandHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  expandedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  expandedTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  metalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  metalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metalSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  metalName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
});
