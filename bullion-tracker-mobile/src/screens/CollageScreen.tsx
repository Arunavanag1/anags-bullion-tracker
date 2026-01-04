import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { fetchSpotPrices } from '../lib/prices';
import type { CollectionItem } from '../lib/api';
import type { SpotPrices } from '../types';
import Constants from 'expo-constants';
import { Colors } from '../lib/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Collage'>;

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 columns with 20px padding on sides and 10px gaps

export function CollageScreen({ navigation }: Props) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [itemsData, pricesData] = await Promise.all([
        api.getCollectionItems(),
        fetchSpotPrices(Constants.expoConfig?.extra?.metalPriceApiKey || ''),
      ]);

      // Filter items that have images
      const itemsWithImages = itemsData.filter(item => item.images && item.images.length > 0);
      setItems(itemsWithImages);
      setSpotPrices(pricesData);
    } catch (error) {
      console.error('Failed to load items:', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Flatten all images from all items
  const allImages = items.flatMap(item =>
    (item.images || []).map(imageUrl => ({
      url: imageUrl,
      itemId: item.id,
      itemName: item.type === 'itemized' && item.title ? item.title : `${item.metal} (Bulk)`,
    }))
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {Platform.OS === 'ios' && <View style={styles.statusBarSpacer} />}

      {/* Spot Price Banner */}
      <LinearGradient
        colors={[Colors.bannerGradientStart, Colors.bannerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.spotBanner}
      >
        {spotPrices && (
          <>
            <PricePill metal="Au" price={spotPrices.gold} color={Colors.gold} />
            <PricePill metal="Ag" price={spotPrices.silver} color={Colors.silver} />
            <PricePill metal="Pt" price={spotPrices.platinum} color={Colors.platinum} />
          </>
        )}
      </LinearGradient>

      {allImages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyText}>
            Add photos to your collection items to see them here
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddItem', {})}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add Item with Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentDark} />
          }
        >
          <View style={styles.grid}>
            {allImages.map((image, index) => (
              <TouchableOpacity
                key={`${image.itemId}-${index}`}
                style={styles.gridItem}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: image.url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton
          icon="◎"
          label="Dashboard"
          active={false}
          onPress={() => navigation.navigate('Dashboard')}
        />
        <TabButton
          icon="◉"
          label="Collection"
          active={false}
          onPress={() => navigation.navigate('Collection')}
          badge={items.length}
        />
        <TabButton
          icon="❖"
          label="Photos"
          active={true}
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

const PricePill = ({ metal, price, color }: { metal: string; price: number; color: string }) => (
  <View style={styles.pricePill}>
    <Text style={[styles.metalSymbol, { color }]}>{metal}</Text>
    <Text style={styles.priceValue}>
      ${price.toLocaleString()}
      <Text style={styles.priceUnit}>/oz</Text>
    </Text>
  </View>
);

const TabButton = ({ icon, label, active, onPress, badge }: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.tabButton}>
    <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    {badge !== undefined && badge > 0 && (
      <View style={styles.tabBadge}>
        <Text style={styles.tabBadgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

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
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metalSymbol: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  priceUnit: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.bgSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    color: '#bbb',
  },
  tabIconActive: {
    color: Colors.textPrimary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
