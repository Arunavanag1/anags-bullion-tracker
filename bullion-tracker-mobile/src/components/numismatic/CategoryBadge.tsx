import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ItemCategory } from '../../types';

interface CategoryBadgeProps {
  category: ItemCategory;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const colors = category === 'BULLION'
    ? { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }
    : { bg: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' };

  const fontSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14;
  const padding = size === 'sm' ? 4 : size === 'md' ? 6 : 8;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border, padding }]}>
      <Text style={[styles.text, { color: colors.text, fontSize }]}>
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
