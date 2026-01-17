import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../lib/colors';

interface ChartContainerProps {
  title?: string;
  height?: number;
  loading?: boolean;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  height = 200,
  loading,
  children,
}: ChartContainerProps) {
  return (
    <View style={[styles.container, { height: height + (title ? 40 : 0) }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {loading ? (
        <View style={[styles.loadingContainer, { height }]}>
          <ActivityIndicator color={Colors.accentTeal} />
        </View>
      ) : (
        <View style={{ height }}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
