import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ProblemType } from '../../types';

interface ProblemCoinBadgeProps {
  isProblem: boolean;
  problemType?: ProblemType;
}

export function ProblemCoinBadge({ isProblem, problemType }: ProblemCoinBadgeProps) {
  if (!isProblem || !problemType) return null;

  const label = problemType.toUpperCase();
  const color = problemType === 'damaged' ? '#EA580C' : '#EF4444';

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>⚠️ {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
