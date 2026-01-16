import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { View, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';

export interface RadialGalleryProps {
  children: (selectedIndex: number | null) => ReactNode[];
  onItemSelect?: (index: number) => void;
}

/**
 * A scroll-driven circular gallery optimized for mobile screens.
 * Items are arranged in a full circle and rotate as the user scrolls.
 *
 * @example
 * <RadialGallery onItemSelect={(i) => openLightbox(items[i])}>
 *   {() => items.map((item) => <MobilePhotoCard key={item.id} item={item} />)}
 * </RadialGallery>
 */
export function RadialGallery({
  children,
  onItemSelect,
}: RadialGalleryProps) {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [rotation, setRotation] = useState(0);

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;

  const items = children(null);
  const itemCount = items.length;

  if (itemCount === 0) {
    return null;
  }

  // Circular layout: items distributed evenly around a circle
  // Use a radius that fits the screen width with some padding
  const radius = Math.min(screenWidth * 0.32, 140);

  // Card size scales with screen
  const cardScale = screenWidth < 375 ? 0.7 : 0.8;

  // Each item gets an equal slice of 360°
  const anglePerItem = 360 / itemCount;

  // Scroll height for animation
  const scrollHeight = screenHeight * 2;
  const maxScroll = scrollHeight - screenHeight;

  // Handle scroll - rotate the circle
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const progress = Math.min(Math.max(y / maxScroll, 0), 1);

    // Full rotation (360°) as user scrolls
    const newRotation = progress * 360;
    setRotation(newRotation);
  };

  // Center position for the circle
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.38; // Position circle in upper-middle area

  return (
    <View style={styles.container}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: scrollHeight }}
        style={styles.scrollView}
      >
        {/* Transparent scroll area */}
      </ScrollView>

      {/* Circular arrangement of items */}
      <View style={styles.circleContainer} pointerEvents="box-none">
        {items.map((item, index) => {
          // Calculate position on circle
          // Start from top (-90°) and go clockwise
          const baseAngle = -90 + (index * anglePerItem);
          const currentAngle = baseAngle + rotation;
          const rad = (currentAngle * Math.PI) / 180;

          const x = centerX + Math.cos(rad) * radius;
          const y = centerY + Math.sin(rad) * radius;

          // Z-index based on vertical position (items at bottom appear in front)
          const zIndex = Math.round(Math.sin(rad) * 100) + 100;

          // Scale items based on position (items at front slightly larger)
          const positionScale = 0.85 + (Math.sin(rad) + 1) * 0.1;
          const finalScale = cardScale * positionScale;

          // Opacity: items at back slightly faded
          const opacity = 0.7 + (Math.sin(rad) + 1) * 0.15;

          return (
            <View
              key={index}
              style={[
                styles.itemWrapper,
                {
                  left: x,
                  top: y,
                  zIndex,
                  opacity,
                  transform: [
                    { translateX: -70 }, // Half card width
                    { translateY: -100 }, // Half card height
                    { scale: finalScale },
                  ],
                },
              ]}
              onTouchEnd={() => onItemSelect?.(index)}
              accessibilityRole="button"
              accessibilityLabel={`Collection item ${index + 1} of ${itemCount}`}
              accessibilityHint="Tap to view details"
            >
              {item}
            </View>
          );
        })}
      </View>

      {/* Scroll hint */}
      <View style={styles.scrollHint}>
        <View style={styles.scrollDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  circleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  itemWrapper: {
    position: 'absolute',
  },
  scrollHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
