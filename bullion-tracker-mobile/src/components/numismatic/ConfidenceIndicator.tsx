import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConfidenceLevel } from '../../types';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  lastUpdated?: string;
}

export function ConfidenceIndicator({ level, lastUpdated }: ConfidenceIndicatorProps) {
  const colors = {
    high: '#22C55E',
    medium: '#EAB308',
    low: '#EF4444',
  };

  const dots = level === 'high' ? 3 : level === 'medium' ? 2 : 1;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < dots ? colors[level] : '#E5E7EB' },
            ]}
          />
        ))}
      </View>
      <Text style={styles.text}>Confidence: {level}</Text>
      {lastUpdated && (
        <Text style={styles.date}>Updated {new Date(lastUpdated).toLocaleDateString()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    color: '#6B7280',
  },
  date: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});
