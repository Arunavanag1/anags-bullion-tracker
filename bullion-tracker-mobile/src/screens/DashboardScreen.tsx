import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { useSpotPrices } from '../contexts/SpotPricesContext';
import { api } from '../lib/api';
import { getGainDisplayFormat, setGainDisplayFormat, type GainDisplayFormat } from '../lib/settings';
import { calculatePortfolioSummary, formatCurrency, formatCurrencyCompact, formatPercentage } from '../lib/calculations';
import { savePortfolioValue, calculateDailyGain, get24hAgoValue } from '../lib/dailyTracking';
import type { ValuationBreakdown } from '../types';
import type { CollectionItem } from '../lib/api';
import { Colors } from '../lib/colors';
import { useCollectionSummary } from '../hooks/useCoins';
import { TopPerformers } from '../components/TopPerformers';
import { SpotPriceBanner } from '../components/ui/SpotPriceBanner';
import { TabBar } from '../components/ui/TabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { spotPrices, refresh: refreshSpotPrices } = useSpotPrices();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGain, setDailyGain] = useState<number | null>(null);
  const [yesterdayValue, setYesterdayValue] = useState<number | null>(null);
  const [gainDisplayFormat, setGainDisplayFormatState] = useState<GainDisplayFormat>('dollar');
  const [valuationBreakdown, setValuationBreakdown] = useState<ValuationBreakdown | null>(null);
  const { data: categorySummary, isLoading: summaryLoading } = useCollectionSummary();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const loadData = async () => {
    try {
      const [itemsData, gainFormat, breakdown] = await Promise.all([
        api.getCollectionItems(),
        getGainDisplayFormat(),
        api.getValuationBreakdown().catch(() => null),
      ]);

      setItems(itemsData as any);
      setGainDisplayFormatState(gainFormat);
      setValuationBreakdown(breakdown);

      // Calculate current portfolio value and save for daily tracking
      // Always use totalBookValue (unified portfolio value)
      if (itemsData && spotPrices) {
        const summary = calculatePortfolioSummary(itemsData as any, spotPrices);
        const currentValue = summary.totalBookValue;

        // Save current value for future 24h comparisons
        await savePortfolioValue(currentValue);

        // Calculate daily gain (change from 24h ago)
        const gain24h = await calculateDailyGain(currentValue);
        setDailyGain(gain24h);

        // Get yesterday's value for percentage calculation
        const value24hAgo = await get24hAgoValue();
        setYesterdayValue(value24hAgo);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.message?.includes('Failed to fetch')) {
        Alert.alert('Connection Error', 'Could not connect to server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshSpotPrices()]);
  };

  const handleGainDisplayFormatChange = async (format: GainDisplayFormat) => {
    setGainDisplayFormatState(format);
    await setGainDisplayFormat(format);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const summary = spotPrices ? calculatePortfolioSummary(items, spotPrices) : null;
  // Always use totalBookValue as the unified portfolio value
  const currentValue = summary ? summary.totalBookValue : 0;

  // Calculate allocation percentages
  const totalMeltValue = summary?.totalMeltValue || 1;
  const goldValue = (summary?.totalWeight.gold || 0) * (spotPrices?.gold || 0);
  const silverValue = (summary?.totalWeight.silver || 0) * (spotPrices?.silver || 0);
  const platinumValue = (summary?.totalWeight.platinum || 0) * (spotPrices?.platinum || 0);

  const goldPct = (goldValue / totalMeltValue) * 100;
  const silverPct = (silverValue / totalMeltValue) * 100;
  const platinumPct = (platinumValue / totalMeltValue) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {Platform.OS === 'ios' && <View style={styles.statusBarSpacer} />}

      {/* Spot Price Banner - Expandable */}
      <SpotPriceBanner spotPrices={spotPrices} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentDark} />
        }
      >
        {/* User Header */}
        <View style={styles.userHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'User'}'s Stack</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={styles.lastUpdated}>Last updated just now</Text>
              <Text style={{ color: Colors.textSecondary }}>•</Text>
              <TouchableOpacity onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddItem', {})}
            style={styles.addButton}
          >
            <Text style={styles.addButtonPlus}>+</Text>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio Value Card */}
        <View style={styles.portfolioCard}>
          {/* Hero Value */}
          <View style={styles.heroValueContainer}>
            <Text style={styles.heroLabel}>PORTFOLIO VALUE</Text>
            <Text style={styles.heroValue}>
              {formatCurrency(currentValue)}
            </Text>
          </View>

          {/* Gain/Loss Row */}
          {summary && (
            <View style={styles.gainLossContainer}>
              <View style={styles.gainLossRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metricLabel}>Daily Gain</Text>
                  {dailyGain !== null && yesterdayValue !== null ? (
                    gainDisplayFormat === 'dollar' ? (
                      <Text style={[
                        styles.metricValue,
                        { color: dailyGain >= 0 ? Colors.positive : Colors.negative }
                      ]}>
                        {dailyGain >= 0 ? '+' : ''}{formatCurrencyCompact(dailyGain)}
                      </Text>
                    ) : (
                      <Text style={[
                        styles.metricValue,
                        { color: dailyGain >= 0 ? Colors.positive : Colors.negative }
                      ]}>
                        {dailyGain >= 0 ? '+' : ''}{formatPercentage((dailyGain / yesterdayValue) * 100)}
                      </Text>
                    )
                  ) : (
                    <Text style={[styles.metricValue, { color: Colors.textSecondary }]}>
                      —
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metricLabel}>Total Return</Text>
                  {gainDisplayFormat === 'dollar' ? (
                    <Text style={[
                      styles.metricValue,
                      { color: summary.totalGain >= 0 ? Colors.positive : Colors.negative }
                    ]}>
                      {summary.totalGain >= 0 ? '+' : ''}{formatCurrencyCompact(summary.totalGain)}
                    </Text>
                  ) : (
                    <Text style={[
                      styles.metricValue,
                      { color: summary.totalGain >= 0 ? Colors.positive : Colors.negative }
                    ]}>
                      {formatPercentage(summary.gainPercentage)}
                    </Text>
                  )}
                </View>
                <View style={styles.gainToggleContainer}>
                  <TouchableOpacity
                    onPress={() => handleGainDisplayFormatChange('dollar')}
                    style={[styles.gainToggleButton, gainDisplayFormat === 'dollar' && styles.gainToggleButtonActive]}
                  >
                    <Text style={[styles.gainToggleText, gainDisplayFormat === 'dollar' && styles.gainToggleTextActive]}>$</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleGainDisplayFormatChange('percent')}
                    style={[styles.gainToggleButton, gainDisplayFormat === 'percent' && styles.gainToggleButtonActive]}
                  >
                    <Text style={[styles.gainToggleText, gainDisplayFormat === 'percent' && styles.gainToggleTextActive]}>%</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Allocation Card */}
        {summary && summary.totalMeltValue > 0 && (
          <View style={styles.allocationCard}>
            <Text style={styles.allocationLabel}>ALLOCATION</Text>

            {/* Horizontal Bar */}
            <View style={styles.allocationBar}>
              {goldPct > 0 && (
                <View style={{ width: `${goldPct}%`, backgroundColor: Colors.gold, height: '100%' }} />
              )}
              {silverPct > 0 && (
                <View style={{ width: `${silverPct}%`, backgroundColor: Colors.silver, height: '100%', borderLeftWidth: 2, borderLeftColor: '#fff' }} />
              )}
              {platinumPct > 0 && (
                <View style={{ width: `${platinumPct}%`, backgroundColor: Colors.platinum, height: '100%', borderLeftWidth: 2, borderLeftColor: '#fff' }} />
              )}
            </View>

            {/* Legend */}
            <View style={styles.allocationLegend}>
              {goldPct > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
                  <Text style={styles.legendText}>
                    Gold <Text style={styles.legendPct}>{goldPct.toFixed(0)}%</Text>
                  </Text>
                </View>
              )}
              {silverPct > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.silver }]} />
                  <Text style={styles.legendText}>
                    Silver <Text style={styles.legendPct}>{silverPct.toFixed(0)}%</Text>
                  </Text>
                </View>
              )}
              {platinumPct > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.platinum }]} />
                  <Text style={styles.legendText}>
                    Platinum <Text style={styles.legendPct}>{platinumPct.toFixed(0)}%</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Category Breakdown Card */}
        {categorySummary && !summaryLoading && (categorySummary.bullionItems > 0 || categorySummary.numismaticItems > 0) && (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryLabel}>CATEGORY BREAKDOWN</Text>

            <View style={styles.categoryRow}>
              <View style={styles.categoryItem}>
                <Text style={styles.categoryTitle}>Bullion</Text>
                <Text style={styles.categoryValue}>{formatCurrency(categorySummary.bullionValue)}</Text>
                <Text style={styles.categoryCount}>{categorySummary.bullionItems} items</Text>
              </View>

              <View style={styles.categoryDivider} />

              <View style={styles.categoryItem}>
                <Text style={styles.categoryTitle}>Numismatic</Text>
                <Text style={styles.categoryValue}>{formatCurrency(categorySummary.numismaticValue)}</Text>
                <Text style={styles.categoryCount}>{categorySummary.numismaticItems} items</Text>
              </View>
            </View>
          </View>
        )}

        {/* Valuation Breakdown Card */}
        {valuationBreakdown && (valuationBreakdown.spotPremium.count > 0 || valuationBreakdown.guidePrice.count > 0 || valuationBreakdown.custom.count > 0) && (
          <View style={styles.valuationCard}>
            <Text style={styles.valuationLabel}>VALUATION BREAKDOWN</Text>

            <View style={styles.valuationRow}>
              {valuationBreakdown.spotPremium.count > 0 && (
                <View style={styles.valuationItem}>
                  <Text style={styles.valuationTitle}>Spot+Premium</Text>
                  <Text style={styles.valuationValue}>{formatCurrency(valuationBreakdown.spotPremium.totalValue)}</Text>
                  <Text style={styles.valuationCount}>{valuationBreakdown.spotPremium.count} item{valuationBreakdown.spotPremium.count !== 1 ? 's' : ''}</Text>
                  <Text style={[styles.valuationMetric, { color: valuationBreakdown.spotPremium.avgPremiumPercent >= 0 ? Colors.positive : Colors.negative }]}>
                    {valuationBreakdown.spotPremium.avgPremiumPercent >= 0 ? '+' : ''}{valuationBreakdown.spotPremium.avgPremiumPercent.toFixed(1)}% avg
                  </Text>
                </View>
              )}

              {valuationBreakdown.guidePrice.count > 0 && (
                <View style={styles.valuationItem}>
                  <Text style={styles.valuationTitle}>Guide Price</Text>
                  <Text style={styles.valuationValue}>{formatCurrency(valuationBreakdown.guidePrice.totalValue)}</Text>
                  <Text style={styles.valuationCount}>{valuationBreakdown.guidePrice.count} item{valuationBreakdown.guidePrice.count !== 1 ? 's' : ''}</Text>
                  <Text style={[styles.valuationMetric, { color: valuationBreakdown.guidePrice.premiumOverMelt >= 0 ? Colors.positive : Colors.negative }]}>
                    {valuationBreakdown.guidePrice.premiumOverMelt >= 0 ? '+' : ''}{valuationBreakdown.guidePrice.premiumOverMelt.toFixed(1)}% over melt
                  </Text>
                </View>
              )}

              {valuationBreakdown.custom.count > 0 && (
                <View style={styles.valuationItem}>
                  <Text style={styles.valuationTitle}>Custom</Text>
                  <Text style={styles.valuationValue}>{formatCurrency(valuationBreakdown.custom.totalValue)}</Text>
                  <Text style={styles.valuationCount}>{valuationBreakdown.custom.count} item{valuationBreakdown.custom.count !== 1 ? 's' : ''}</Text>
                  <Text style={styles.valuationMetric}>Fixed value</Text>
                </View>
              )}
            </View>

            {valuationBreakdown.lastSyncDate && (
              <Text style={styles.valuationSync}>
                Last synced: {new Date(valuationBreakdown.lastSyncDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Top Performers */}
        <TopPerformers />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <TabBar
        activeTab="dashboard"
        onTabPress={(tab) => {
          if (tab === 'collection') navigation.navigate('Collection');
          if (tab === 'collage') navigation.navigate('Collage');
        }}
        collectionBadge={items.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  statusBarSpacer: {
    height: 44, // Standard iOS status bar height
    backgroundColor: Colors.bannerGradientStart,
  },
  spotBanner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  lastUpdated: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  signOutText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  addButton: {
    backgroundColor: Colors.accentDark,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonPlus: {
    fontSize: 18,
    fontWeight: '300',
    color: 'white',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  portfolioCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  heroValueContainer: {
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gainLossContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gainLossRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  gainToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: 2,
    gap: 2,
    alignSelf: 'flex-start',
  },
  gainToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gainToggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  gainToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  gainToggleTextActive: {
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  allocationCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  allocationLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  allocationBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  allocationLegend: {
    flexDirection: 'row',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  legendPct: {
    color: '#aaa',
  },
  categoryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
  },
  categoryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  categoryTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  categoryValue: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  valuationCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  valuationLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  valuationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valuationItem: {
    flex: 1,
    minWidth: 90,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
  },
  valuationTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valuationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  valuationCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  valuationMetric: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  valuationSync: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 12,
  },
});
