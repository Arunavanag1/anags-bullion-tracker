import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ItemCategory } from '../../types';

/**
 * CategoryStep - First step of add item flow
 *
 * Displays BULLION vs NUMISMATIC category selection cards.
 * BULLION goes directly to details form, NUMISMATIC goes to grading step.
 *
 * @example
 * <CategoryStep onSelect={(cat) => setCategory(cat)} />
 */
interface CategoryStepProps {
  onSelect: (category: ItemCategory) => void;
}

export function CategoryStep({ onSelect }: CategoryStepProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>What type of item are you adding?</Text>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => onSelect('BULLION')}
      >
        <Text style={styles.categoryIcon}>🥇</Text>
        <Text style={styles.categoryTitle}>Bullion</Text>
        <Text style={styles.categoryDescription}>
          Bars, rounds, and generic precious metals
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => onSelect('NUMISMATIC')}
      >
        <Text style={styles.categoryIcon}>🪙</Text>
        <Text style={styles.categoryTitle}>Numismatic</Text>
        <Text style={styles.categoryDescription}>
          Collectible coins with grading and value tracking
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
