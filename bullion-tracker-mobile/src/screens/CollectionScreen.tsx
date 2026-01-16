import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSpotPrices } from '../contexts/SpotPricesContext';
import { api } from '../lib/api';
import type { CollectionItem } from '../lib/api';
import { formatCurrency, formatCurrencyCompact, formatPercentage, formatWeight, calculateGain, calculateGainPercentage, calculateBookValue, calculatePurchaseCost } from '../lib/calculations';
import { getPriceForDate } from '../lib/historical-data';
import type { SpotPrices, ItemCategory } from '../types';
import { Colors } from '../lib/colors';
import { CategoryBadge } from '../components/numismatic/CategoryBadge';
import { ProblemCoinBadge } from '../components/numismatic/ProblemCoinBadge';
import { SpotPriceBanner } from '../components/ui/SpotPriceBanner';
import { TabBar } from '../components/ui/TabBar';
import { ValueHistoryChart } from '../components/numismatic/ValueHistoryChart';

type Props = NativeStackScreenProps<RootStackParamList, 'Collection'>;

export function CollectionScreen({ navigation }: Props) {
  const { spotPrices, refresh: refreshSpotPrices } = useSpotPrices();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'ALL'>('ALL');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const itemsData = await api.getCollectionItems();
      setItems(itemsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.message?.includes('Failed to fetch')) {
        Alert.alert('Connection Error', 'Could not connect to server.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshSpotPrices()]);
  };

  const handleDelete = (item: CollectionItem) => {
    const itemName = item.title || `${item.metal} (Bulk)`;
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCollectionItem(item.id);
              await loadData();
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item: CollectionItem) => {
    navigation.navigate('AddItem', { itemId: item.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {Platform.OS === 'ios' && <View style={styles.statusBarSpacer} />}

      {/* Spot Price Banner - Expandable */}
      <SpotPriceBanner spotPrices={spotPrices} />

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>
            Start building your collection by adding your first bullion item
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddItem', {})}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Header with Add Button */}
          <View style={styles.collectionHeader}>
            <Text style={styles.collectionTitle}>My Collection</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddItem', {})}
              style={styles.addButtonHeader}
            >
              <Text style={styles.addButtonPlus}>+</Text>
              <Text style={styles.addButtonHeaderText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Chips */}
          <View style={styles.filterContainer}>
            <FilterChip
              label="All"
              active={categoryFilter === 'ALL'}
              onPress={() => setCategoryFilter('ALL')}
              count={items.length}
            />
            <FilterChip
              label="Bullion"
              active={categoryFilter === 'BULLION'}
              onPress={() => setCategoryFilter('BULLION')}
              count={items.filter(i => (i.category || 'BULLION') === 'BULLION').length}
            />
            <FilterChip
              label="Numismatic"
              active={categoryFilter === 'NUMISMATIC'}
              onPress={() => setCategoryFilter('NUMISMATIC')}
              count={items.filter(i => i.category === 'NUMISMATIC').length}
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentDark} />
            }
          >
          {(() => {
            // Get yesterday's prices for daily change calculation
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayPrices = getPriceForDate(yesterday);

            return items
              .filter(item => categoryFilter === 'ALL' || (item.category || 'BULLION') === categoryFilter)
              .map((item) => {
              const itemName = item.title || `${item.metal} (Bulk)`;
              const spotPrice = spotPrices?.[item.metal as keyof SpotPrices] || 0;
              const pureWeight = (item.weightOz || 0) * (item.quantity || 1);
              const meltValue = pureWeight * (typeof spotPrice === 'number' ? spotPrice : 0);

              // Calculate current book value using the proper function
              const currentValue = calculateBookValue(item, typeof spotPrice === 'number' ? spotPrice : 0);

              // Calculate gain using the proper function
              const gain = calculateGain(item, typeof spotPrice === 'number' ? spotPrice : 0);
              const gainPercent = calculateGainPercentage(item, typeof spotPrice === 'number' ? spotPrice : 0);

              // Calculate daily change based on value difference
              // For bullion: value = weight × spot × (1 + premium%)
              // For numismatic: value doesn't change daily (guide prices don't update daily)
              const metalKey = item.metal as 'gold' | 'silver' | 'platinum';
              const yesterdaySpot = yesterdayPrices[metalKey] || 0;
              const todaySpot = typeof spotPrice === 'number' ? spotPrice : 0;

              let dailyValueChange = 0;
              let dailyChangePercent = 0;

              const bookValueType = item.bookValueType as string;
              if (bookValueType === 'spot_premium' || bookValueType === 'spot' || !bookValueType) {
                // Bullion: calculate based on spot price change with premium
                const premiumMultiplier = 1 + ((item.premiumPercent || 0) / 100);
                const todayValue = pureWeight * todaySpot * premiumMultiplier;
                const yesterdayValue = pureWeight * yesterdaySpot * premiumMultiplier;
                dailyValueChange = todayValue - yesterdayValue;
                dailyChangePercent = yesterdayValue > 0 ? (dailyValueChange / yesterdayValue) * 100 : 0;
              }
              // For numismatic (guide_price, custom): daily change is 0 since guide prices don't update daily

              return (
                <View key={item.id} style={styles.itemCard}>
                  {/* Daily Change Bubble */}
                  <View style={[
                    styles.dailyChangeBubble,
                    { backgroundColor: dailyChangePercent >= 0 ? Colors.positive + '20' : Colors.negative + '20' }
                  ]}>
                    <Text style={[
                      styles.dailyChangeText,
                      { color: dailyChangePercent >= 0 ? Colors.positive : Colors.negative }
                    ]}>
                      {dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.itemRow}>
                  {/* Image */}
                  <View style={styles.imageContainer}>
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderEmoji}>{getMetalEmoji(item.metal || 'gold')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.itemContent}>
                    {/* Category badge left, metal/weight right */}
                    <View style={styles.badgeWeightRow}>
                      <View style={styles.badgeGroup}>
                        <CategoryBadge category={item.category || 'BULLION'} />
                        {item.isProblemCoin && item.problemType && (
                          <ProblemCoinBadge isProblem={item.isProblemCoin} problemType={item.problemType} />
                        )}
                      </View>
                      <View style={styles.metalWeightGroup}>
                        <Text style={styles.metalEmoji}>{getMetalEmoji(item.metal || 'gold')}</Text>
                        <Text style={styles.weightText}>
                          {item.weightOz || 0} oz{(item.quantity || 1) > 1 && ` × ${item.quantity}`}
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.itemName}>{itemName}</Text>

                    {/* Grade for numismatics */}
                    {item.category === 'NUMISMATIC' && (
                      <Text style={styles.gradeText}>
                        {item.gradingService ? `${item.gradingService} ` : ''}{item.grade}
                        {item.certificationNumber && ` • Cert #${item.certificationNumber}`}
                      </Text>
                    )}

                    {/* Primary Value */}
                    <View style={styles.valueRowSpaced}>
                      <Text style={styles.valueLabel}>
                        {item.category === 'NUMISMATIC' ? 'Guide Value:' : 'Current Value:'}
                      </Text>
                      <Text style={styles.primaryValue}>{formatCurrency(currentValue)}</Text>
                    </View>

                    {/* Total Return */}
                    <View style={styles.returnRow}>
                      <Text style={styles.valueLabel}>Total Return:</Text>
                      <Text style={[
                        styles.returnValue,
                        { color: gain >= 0 ? Colors.positive : Colors.negative }
                      ]}>
                        {gain >= 0 ? '+' : ''}{formatCurrencyCompact(gain)} ({formatPercentage(gainPercent)})
                      </Text>
                    </View>

                    {/* Secondary Melt Value - indented */}
                    <View style={styles.meltInfoRowSpaced}>
                      <Text style={styles.meltInfoText}>
                        Melt: {formatCurrency(meltValue)}
                        {item.category === 'BULLION' && (
                          `  (${(item.premiumPercent || 0) > 0 ? '+' : ''}${item.premiumPercent || 0}% premium)`
                        )}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price History for numismatic guide_price items */}
                {item.category === 'NUMISMATIC' && item.bookValueType === 'guide_price' && (
                  <View style={styles.historySection}>
                    <TouchableOpacity
                      onPress={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                      style={styles.historyToggle}
                    >
                      <Text style={styles.historyToggleText}>
                        {expandedHistory === item.id ? '▼ Hide Price History' : '▶ Show Price History'}
                      </Text>
                    </TouchableOpacity>
                    {expandedHistory === item.id && (
                      <ValueHistoryChart
                        itemId={item.id}
                        currentValue={item.numismaticValue}
                      />
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={[styles.actionButton, styles.editButton]}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={[styles.actionButton, styles.deleteButton]}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            });
          })()}
          </ScrollView>
        </>
      )}

      {/* Bottom Tab Bar */}
      <TabBar
        activeTab="collection"
        onTabPress={(tab) => {
          if (tab === 'dashboard') navigation.navigate('Dashboard');
          if (tab === 'collage') navigation.navigate('Collage');
        }}
        collectionBadge={items.length}
      />
    </View>
  );
}

const FilterChip = ({ label, active, onPress, count }: {
  label: string;
  active: boolean;
  onPress: () => void;
  count: number;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterChip, active && styles.filterChipActive]}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label} ({count})
    </Text>
  </TouchableOpacity>
);

function getMetalEmoji(metal: string): string {
  switch (metal.toLowerCase()) {
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'platinum':
      return '⚪';
    default:
      return '●';
  }
}

function getMetalColor(metal: string): string {
  switch (metal.toLowerCase()) {
    case 'gold':
      return Colors.gold;
    case 'silver':
      return Colors.silver;
    case 'platinum':
      return Colors.platinum;
    default:
      return Colors.textSecondary;
  }
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
    height: 44,
    backgroundColor: Colors.bannerGradientStart,
  },
  spotBanner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  collectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  addButtonHeader: {
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
  addButtonHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accentDark,
    borderColor: Colors.accentDark,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.accentDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    position: 'relative',
  },
  dailyChangeBubble: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  dailyChangeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.bgSecondary,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  itemContent: {
    flex: 1,
  },
  badgeWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metalWeightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metalEmoji: {
    fontSize: 14,
  },
  weightText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  valueRowSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  valueLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  returnValue: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'right',
    flexShrink: 1,
  },
  valueWithChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  changeValue: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  meltInfoRow: {
    paddingLeft: 12,
    marginTop: 2,
  },
  meltInfoRowSpaced: {
    paddingLeft: 12,
    marginTop: 8,
  },
  meltInfoText: {
    fontSize: 11,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.bgSecondary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  deleteButton: {
    backgroundColor: Colors.bgSecondary,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.negative,
  },
  historySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyToggle: {
    paddingVertical: 8,
  },
  historyToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accentDark,
  },
});
