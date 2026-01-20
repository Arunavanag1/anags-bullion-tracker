import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSpotPrices } from '../contexts/SpotPricesContext';
import { api } from '../lib/api';
import type { CollectionItem } from '../lib/api';
import { Colors } from '../lib/colors';
import { PricePill } from '../components/ui/PricePill';
import { TabBar } from '../components/ui/TabBar';
import { RadialGallery } from '../components/gallery/RadialGallery';
import { MobilePhotoCard } from '../components/gallery/MobilePhotoCard';
import { ImageLightbox } from '../components/gallery/ImageLightbox';

type Props = NativeStackScreenProps<RootStackParamList, 'Collage'>;

export function CollageScreen({ navigation }: Props) {
  const { spotPrices, refresh: refreshSpotPrices } = useSpotPrices();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      const itemsData = await api.getCollectionItems();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Filter items that have images
        const itemsWithImages = itemsData.filter(item => item.images && item.images.length > 0);
        setItems(itemsWithImages);
      }
    } catch (error) {
      // Ignore AbortError - it's expected when navigating away or on timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to load items:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshSpotPrices()]);
  };

  const openLightbox = (item: CollectionItem, imageIndex: number = 0) => {
    setSelectedItem(item);
    setCurrentImageIndex(imageIndex);
  };

  const closeLightbox = () => {
    setSelectedItem(null);
    setCurrentImageIndex(0);
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

      {items.length === 0 ? (
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
        <RadialGallery onItemSelect={(index) => openLightbox(items[index], 0)}>
          {() =>
            items.map((item) => (
              <MobilePhotoCard
                key={item.id}
                item={item}
                imageUrl={item.images?.[0] || ''}
              />
            ))
          }
        </RadialGallery>
      )}

      {/* Gesture-based Lightbox */}
      <ImageLightbox
        visible={selectedItem !== null}
        item={selectedItem}
        initialImageIndex={currentImageIndex}
        onClose={closeLightbox}
      />

      {/* Bottom Tab Bar */}
      <TabBar
        activeTab="collage"
        onTabPress={(tab) => {
          if (tab === 'dashboard') navigation.navigate('Dashboard');
          if (tab === 'collection') navigation.navigate('Collection');
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
});
