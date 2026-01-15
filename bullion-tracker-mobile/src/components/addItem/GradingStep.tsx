import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { GradingService } from '../../types';

/**
 * GradingStep - Second step for numismatic items
 *
 * Displays grading service selection: RAW, PCGS, or NGC.
 * Selected service determines form fields shown in details step.
 *
 * @example
 * <GradingStep onSelect={(service) => setGradingService(service)} />
 */
interface GradingStepProps {
  onSelect: (service: GradingService) => void;
}

export function GradingStep({ onSelect }: GradingStepProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How is your coin graded?</Text>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => onSelect('RAW')}
      >
        <Text style={styles.categoryIcon}>📦</Text>
        <Text style={styles.categoryTitle}>RAW (Ungraded)</Text>
        <Text style={styles.categoryDescription}>
          Coin is not professionally graded or slabbed
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => onSelect('PCGS')}
      >
        <Text style={styles.categoryIcon}>🏛️</Text>
        <Text style={styles.categoryTitle}>PCGS Graded</Text>
        <Text style={styles.categoryDescription}>
          Professionally graded and encapsulated by PCGS
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => onSelect('NGC')}
      >
        <Text style={styles.categoryIcon}>🏛️</Text>
        <Text style={styles.categoryTitle}>NGC Graded</Text>
        <Text style={styles.categoryDescription}>
          Professionally graded and encapsulated by NGC
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
