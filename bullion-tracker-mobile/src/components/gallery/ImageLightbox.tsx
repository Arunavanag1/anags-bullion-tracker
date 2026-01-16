import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  Platform,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import type { CollectionItem } from '../../lib/api';
import { formatCurrency, formatWeight } from '../../lib/calculations';
import { Colors } from '../../lib/colors';
import { useSpotPrices } from '../../contexts/SpotPricesContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
const DISMISS_THRESHOLD = 100;

export interface ImageLightboxProps {
  visible: boolean;
  item: CollectionItem | null;
  initialImageIndex?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const METAL_COLORS: Record<string, string> = {
  gold: Colors.gold,
  silver: Colors.silver,
  platinum: Colors.platinum,
};

/**
 * Lightbox for viewing collection item images with swipe navigation.
 *
 * Supports:
 * - Horizontal swipe to navigate between images
 * - Vertical swipe down to dismiss
 * - Tap indicators to jump to specific image
 *
 * @example
 * <ImageLightbox
 *   visible={selectedItem !== null}
 *   item={selectedItem}
 *   initialImageIndex={0}
 *   onClose={() => setSelectedItem(null)}
 * />
 */
export function ImageLightbox({
  visible,
  item,
  initialImageIndex = 0,
  onClose,
  onNext,
  onPrevious,
}: ImageLightboxProps) {
  const { spotPrices } = useSpotPrices();
  const [displayIndex, setDisplayIndex] = useState(initialImageIndex);

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const images = item?.images || [];
  const imageCount = images.length;

  // Reset state when item changes or lightbox opens
  useEffect(() => {
    if (visible && item) {
      setDisplayIndex(initialImageIndex);
      translateX.setValue(0);
      translateY.setValue(0);
      opacity.setValue(1);
    }
  }, [visible, item, initialImageIndex]);

  const navigateToImage = (direction: 'next' | 'prev') => {
    if (direction === 'next' && displayIndex < imageCount - 1) {
      setDisplayIndex(displayIndex + 1);
      onNext?.();
    } else if (direction === 'prev' && displayIndex > 0) {
      setDisplayIndex(displayIndex - 1);
      onPrevious?.();
    }
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const springBack = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to significant movements
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);

        // Fade out as user swipes down
        if (gestureState.dy > 0) {
          const newOpacity = 1 - (gestureState.dy / (DISMISS_THRESHOLD * 2));
          opacity.setValue(Math.max(0.3, newOpacity));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Horizontal swipe - navigate images
        if (
          Math.abs(gestureState.dx) > SWIPE_THRESHOLD &&
          Math.abs(gestureState.dy) < SWIPE_THRESHOLD
        ) {
          if (gestureState.dx < -SWIPE_THRESHOLD) {
            navigateToImage('next');
          } else if (gestureState.dx > SWIPE_THRESHOLD) {
            navigateToImage('prev');
          }
          springBack();
          return;
        }

        // Vertical swipe down - dismiss
        if (gestureState.dy > DISMISS_THRESHOLD) {
          handleDismiss();
          return;
        }

        // Spring back to original position
        springBack();
      },
    })
  ).current;

  if (!item) return null;

  const metal = item.metal || 'silver';
  const metalColor = METAL_COLORS[metal] || Colors.silver;
  const title = item.title || `${metal.charAt(0).toUpperCase() + metal.slice(1)} (Bulk)`;
  const meltValue = (item.weightOz || 0) * (spotPrices?.[metal as 'gold' | 'silver' | 'platinum'] || 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close lightbox"
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image container with gestures */}
          <View style={styles.imageSection}>
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  transform: [
                    { translateX },
                    { translateY },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              {images[displayIndex] && (
                <Image
                  source={{ uri: images[displayIndex] }}
                  style={styles.image}
                  resizeMode="contain"
                  accessibilityLabel={`${title} image ${displayIndex + 1} of ${imageCount}`}
                />
              )}
            </Animated.View>

            {/* Navigation arrows for multiple images */}
            {imageCount > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={() => navigateToImage('prev')}
                  disabled={displayIndex === 0}
                  accessibilityLabel="Previous image"
                >
                  <Text style={[styles.navButtonText, displayIndex === 0 && styles.navButtonDisabled]}>
                    ‹
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={() => navigateToImage('next')}
                  disabled={displayIndex === imageCount - 1}
                  accessibilityLabel="Next image"
                >
                  <Text style={[styles.navButtonText, displayIndex === imageCount - 1 && styles.navButtonDisabled]}>
                    ›
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Image indicators */}
            {imageCount > 1 && (
              <View style={styles.indicators}>
                {images.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setDisplayIndex(idx)}
                    style={[
                      styles.indicator,
                      idx === displayIndex && styles.indicatorActive,
                    ]}
                    accessibilityLabel={`Go to image ${idx + 1}`}
                    accessibilityRole="button"
                  />
                ))}
              </View>
            )}

            {/* Swipe hint for multiple images */}
            {imageCount > 1 && displayIndex === 0 && (
              <Text style={styles.swipeHint}>Swipe to see more photos</Text>
            )}
          </View>

          {/* Details panel */}
          <View style={styles.detailsPanel}>
            {/* Metal badge */}
            <View style={[styles.metalBadge, { backgroundColor: metalColor }]}>
              <Text style={styles.metalBadgeText}>{metal.toUpperCase()}</Text>
            </View>

            {/* Title */}
            <Text style={styles.itemTitle} numberOfLines={2}>
              {title}
            </Text>

            {/* Details grid */}
            <View style={styles.detailsGrid}>
              {item.grade && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Grade</Text>
                  <Text style={styles.detailValue}>
                    {item.gradingService ? `${item.gradingService} ` : ''}{item.grade}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{formatWeight(item.weightOz || 0)}</Text>
              </View>

              {(item.quantity || 1) > 1 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>{item.quantity}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Melt Value</Text>
                <Text style={styles.detailValue}>{formatCurrency(meltValue)}</Text>
              </View>

              {item.category === 'NUMISMATIC' && item.numismaticValue && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Numismatic Value</Text>
                  <Text style={[styles.detailValue, { color: Colors.gold }]}>
                    {formatCurrency(item.numismaticValue)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
    paddingBottom: 20,
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
  imageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
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
    left: 30,
  },
  navButtonRight: {
    right: 30,
  },
  navButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '300',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
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
  swipeHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 12,
  },
  detailsPanel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
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
});
