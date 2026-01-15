import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, StyleSheet, Platform, Dimensions, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSpotPrices } from '../contexts/SpotPricesContext';
import { api } from '../lib/api';
import type { CollectionItem } from '../lib/api';
import { formatCurrency, formatWeight } from '../lib/calculations';
import { Colors } from '../lib/colors';
import { PricePill } from '../components/ui/PricePill';
import { TabBar } from '../components/ui/TabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Collage'>;

const { width, height } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 columns with 20px padding on sides and 10px gaps

const METAL_COLORS: Record<string, string> = {
  gold: Colors.gold,
  silver: Colors.silver,
  platinum: Colors.platinum,
};

export function CollageScreen({ navigation }: Props) {
  const { spotPrices, refresh: refreshSpotPrices } = useSpotPrices();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const loadData = async () => {
    try {
      const itemsData = await api.getCollectionItems();

      // Filter items that have images
      const itemsWithImages = itemsData.filter(item => item.images && item.images.length > 0);
      setItems(itemsWithImages);
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

  // Flatten all images from all items, keeping track of which item and image index
  const allImages = items.flatMap(item =>
    (item.images || []).map((imageUrl, imgIndex) => ({
      url: imageUrl,
      item,
      imageIndex: imgIndex,
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
                key={`${image.item.id}-${index}`}
                style={styles.gridItem}
                activeOpacity={0.7}
                onPress={() => openLightbox(image.item, image.imageIndex)}
              >
                <Image
                  source={{ uri: image.url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                {/* Metal indicator dot */}
                <View style={[styles.metalDot, { backgroundColor: METAL_COLORS[image.item.metal] || Colors.silver }]} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Lightbox Modal */}
      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={closeLightbox}
      >
        {selectedItem && (
          <View style={styles.lightboxOverlay}>
            <TouchableOpacity style={styles.lightboxBackground} onPress={closeLightbox} activeOpacity={1} />

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeLightbox}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <View style={styles.lightboxContent}>
              {/* Image section */}
              <View style={styles.lightboxImageContainer}>
                <Image
                  source={{ uri: selectedItem.images?.[currentImageIndex] }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />

                {/* Navigation arrows for multiple images */}
                {selectedItem.images && selectedItem.images.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.navButton, styles.navButtonLeft]}
                      onPress={() => setCurrentImageIndex(prev =>
                        prev > 0 ? prev - 1 : (selectedItem.images?.length || 1) - 1
                      )}
                    >
                      <Text style={styles.navButtonText}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.navButton, styles.navButtonRight]}
                      onPress={() => setCurrentImageIndex(prev =>
                        prev < (selectedItem.images?.length || 1) - 1 ? prev + 1 : 0
                      )}
                    >
                      <Text style={styles.navButtonText}>›</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Image indicators */}
                {selectedItem.images && selectedItem.images.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {selectedItem.images.map((_, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setCurrentImageIndex(idx)}
                        style={[
                          styles.indicator,
                          idx === currentImageIndex && styles.indicatorActive
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Details panel */}
              <View style={styles.detailsPanel}>
                {/* Metal badge */}
                <View style={[styles.metalBadge, { backgroundColor: METAL_COLORS[selectedItem.metal] || Colors.silver }]}>
                  <Text style={styles.metalBadgeText}>{selectedItem.metal?.toUpperCase()}</Text>
                </View>

                {/* Title */}
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {selectedItem.title || `${selectedItem.metal} (Bulk)`}
                </Text>

                {/* Details grid */}
                <View style={styles.detailsGrid}>
                  {selectedItem.grade && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Grade</Text>
                      <Text style={styles.detailValue}>
                        {selectedItem.gradingService ? `${selectedItem.gradingService} ` : ''}{selectedItem.grade}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{formatWeight(selectedItem.weightOz || 0)}</Text>
                  </View>

                  {(selectedItem.quantity || 1) > 1 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantity</Text>
                      <Text style={styles.detailValue}>{selectedItem.quantity}</Text>
                    </View>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Melt Value</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency((selectedItem.weightOz || 0) * (spotPrices?.[selectedItem.metal as keyof typeof spotPrices] || 0))}
                    </Text>
                  </View>

                  {selectedItem.category === 'NUMISMATIC' && selectedItem.numismaticValue && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Numismatic Value</Text>
                      <Text style={[styles.detailValue, { color: Colors.gold }]}>
                        {formatCurrency(selectedItem.numismaticValue)}
                      </Text>
                    </View>
                  )}

                  {selectedItem.notes && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.notesSection}>
                        <Text style={styles.detailLabel}>Notes</Text>
                        <Text style={styles.notesText}>{selectedItem.notes}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

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
  metalDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  // Lightbox styles
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 40,
    fontWeight: '300',
  },
  lightboxContent: {
    width: width - 40,
    maxHeight: height - 120,
  },
  lightboxImageContainer: {
    width: '100%',
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLeft: {
    left: 10,
  },
  navButtonRight: {
    right: 10,
  },
  navButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '300',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    backgroundColor: 'white',
  },
  detailsPanel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  metalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  metalBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },
  notesSection: {
    gap: 4,
  },
  notesText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
});
