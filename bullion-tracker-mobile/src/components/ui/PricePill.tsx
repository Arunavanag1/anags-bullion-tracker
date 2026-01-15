import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface PricePillProps {
  metal: string;
  price: number;
  color: string;
}

export function PricePill({ metal, price, color }: PricePillProps) {
  return (
    <View style={styles.pricePill}>
      <Text style={[styles.metalSymbol, { color }]}>{metal}</Text>
      <Text style={styles.priceValue}>
        ${price.toLocaleString()}
        <Text style={styles.priceUnit}>/oz</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metalSymbol: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  priceUnit: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
});
