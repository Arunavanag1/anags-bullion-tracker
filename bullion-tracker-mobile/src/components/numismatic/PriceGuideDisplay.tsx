import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { usePriceGuide } from '../../hooks/useCoins';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface PriceGuideDisplayProps {
  coinId: string | null | undefined;
  grade: string | null | undefined;
  value: string;
  onChange: (value: string) => void;
  useCustom: boolean;
  onToggleCustom: (useCustom: boolean) => void;
  disabled?: boolean;
}

export function PriceGuideDisplay({
  coinId,
  grade,
  value,
  onChange,
  useCustom,
  onToggleCustom,
  disabled,
}: PriceGuideDisplayProps) {
  const { data: priceGuide, isLoading } = usePriceGuide(coinId, grade);

  // Auto-fill when price guide data is available
  useEffect(() => {
    if (!useCustom && priceGuide?.price && coinId && grade) {
      onChange(priceGuide.price.toString());
    }
  }, [priceGuide, useCustom, coinId, grade]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {useCustom ? 'Custom Value ($)' : 'Estimated Value from Guide ($)'}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, (!useCustom && isLoading) && styles.inputDisabled]}
          value={value}
          onChangeText={onChange}
          placeholder={isLoading ? 'Loading from price guide...' : useCustom ? 'Enter custom value' : 'Auto-filled from price guide'}
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          editable={!disabled && (useCustom || !isLoading)}
        />
        {!useCustom && isLoading && (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loader} />
        )}
      </View>

      {!useCustom && priceGuide && priceGuide.price && (
        <View style={styles.infoContainer}>
          <Text style={styles.successText}>
            ✓ Price loaded from PCGS guide (updated {new Date(priceGuide.priceDate).toLocaleDateString()})
          </Text>
          <ConfidenceIndicator level={priceGuide.confidenceLevel} />
          {priceGuide.isStale && (
            <Text style={styles.staleWarning}>⚠️ Offline - using cached pricing</Text>
          )}
        </View>
      )}

      {!useCustom && coinId && grade && priceGuide && !priceGuide.price && !isLoading && (
        <Text style={styles.noDataText}>
          No price guide data available for this coin/grade combination
        </Text>
      )}

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => onToggleCustom(!useCustom)}
        disabled={disabled}
      >
        <Text style={styles.toggleText}>
          {useCustom ? '← Use Price Guide' : 'Use Custom Value →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
  },
  loader: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  infoContainer: {
    marginTop: 6,
    gap: 4,
  },
  successText: {
    fontSize: 11,
    color: '#22A06B',
  },
  noDataText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  staleWarning: {
    fontSize: 11,
    color: '#F59E0B',
  },
  toggleButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
    textAlign: 'center',
  },
});
