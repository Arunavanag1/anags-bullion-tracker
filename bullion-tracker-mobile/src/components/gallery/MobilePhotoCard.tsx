import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { CollectionItem } from '../../lib/api';
import { Colors } from '../../lib/colors';

export interface MobilePhotoCardProps {
  item: CollectionItem;
  imageUrl: string;
  isSelected?: boolean;
  size?: 'sm' | 'md';
}

const METAL_COLORS: Record<string, string> = {
  gold: Colors.gold,
  silver: Colors.silver,
  platinum: Colors.platinum,
};

const SIZE_CONFIG = {
  sm: {
    card: { width: 140, height: 200 },
    image: { height: 120 },
    padding: 10,
    titleSize: 11,
    badgeSize: 9,
    detailSize: 10,
  },
  md: {
    card: { width: 180, height: 250 },
    image: { height: 160 },
    padding: 12,
    titleSize: 13,
    badgeSize: 10,
    detailSize: 11,
  },
};

/**
 * Photo card component for the radial gallery.
 * Displays item image with metal badge, title, grade, and weight.
 *
 * @example
 * <MobilePhotoCard
 *   item={collectionItem}
 *   imageUrl={collectionItem.images?.[0] || ''}
 *   isSelected={selectedIndex === index}
 *   size="md"
 * />
 */
export function MobilePhotoCard({
  item,
  imageUrl,
  isSelected = false,
  size = 'md',
}: MobilePhotoCardProps) {
  const config = SIZE_CONFIG[size];
  const metalColor = METAL_COLORS[item.metal || 'silver'] || Colors.silver;

  // Get display title
  const title = item.title || `${(item.metal || 'Metal').charAt(0).toUpperCase() + (item.metal || 'metal').slice(1)} (Bulk)`;

  // Format weight
  const weightDisplay = item.weightOz ? `${item.weightOz.toFixed(3)} oz` : '';

  // Build accessibility label
  const accessibilityLabel = `${title}, ${item.metal || 'metal'}, ${weightDisplay}${item.grade ? `, ${item.grade}` : ''}`;

  return (
    <View
      style={[
        styles.card,
        config.card,
        isSelected && styles.cardSelected,
      ]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Tap to view full size image and details"
    >
      {/* Image section */}
      <View style={[styles.imageContainer, { height: config.image.height }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}

        {/* Metal badge overlay */}
        <View style={[styles.metalBadge, { backgroundColor: metalColor }]}>
          <Text style={[styles.metalBadgeText, { fontSize: config.badgeSize }]}>
            {(item.metal || 'METAL').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Content section */}
      <View style={[styles.content, { padding: config.padding }]}>
        <Text
          style={[styles.title, { fontSize: config.titleSize }]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={styles.detailsRow}>
          {item.grade && (
            <Text style={[styles.grade, { fontSize: config.detailSize }]}>
              {item.gradingService ? `${item.gradingService} ` : ''}{item.grade}
            </Text>
          )}
          {weightDisplay && (
            <Text style={[styles.weight, { fontSize: config.detailSize }]}>
              {weightDisplay}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardSelected: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  imageContainer: {
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  metalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metalBadgeText: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  grade: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  weight: {
    color: Colors.textSecondary,
  },
});
