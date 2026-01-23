import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useCoinSearch } from '../../hooks/useCoins';
import type { CoinReference } from '../../types';

interface CoinSearchInputProps {
  onSelect: (coin: CoinReference | null) => void;
  selectedCoin: CoinReference | null;
  customCoinName?: string;
  onCustomCoinNameChange?: (name: string) => void;
  disabled?: boolean;
}

export function CoinSearchInput({ onSelect, selectedCoin, customCoinName, onCustomCoinNameChange, disabled }: CoinSearchInputProps) {
  const [query, setQuery] = useState(customCoinName || '');
  const { data: results, isLoading } = useCoinSearch(query);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (selectedCoin) {
      onSelect(null);
    }
    onCustomCoinNameChange?.(text);
  };

  const handleSelectCoin = (coin: CoinReference) => {
    onSelect(coin);
    setQuery('');
    onCustomCoinNameChange?.('');
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    onCustomCoinNameChange?.('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Coin Name</Text>

      {selectedCoin ? (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedContent}>
            <Text style={styles.selectedName}>{selectedCoin.fullName}</Text>
            <Text style={styles.selectedPCGS}>PCGS# {selectedCoin.pcgsNumber}</Text>
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.changeButton} disabled={disabled}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="e.g., 1921 Morgan Dollar"
              placeholderTextColor="#9CA3AF"
              editable={!disabled}
            />
            {isLoading && <ActivityIndicator size="small" color="#3B82F6" style={styles.loader} />}
          </View>
          <Text style={styles.helperText}>Type any coin name or search from our database</Text>

          {results.length > 0 && !selectedCoin && (
            <View style={styles.resultsContainer}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.resultItem, index !== results.length - 1 && styles.resultBorder]}
                    onPress={() => handleSelectCoin(item)}
                  >
                    <Text style={styles.resultName}>{item.fullName}</Text>
                    <Text style={styles.resultPCGS}>PCGS# {item.pcgsNumber}</Text>
                  </TouchableOpacity>
                )}
                style={styles.resultsList}
                scrollEnabled={results.length > 5}
                nestedScrollEnabled
              />
            </View>
          )}
        </>
      )}
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
  loader: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  helperText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 8,
  },
  selectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderLeftWidth: 3,
    borderRadius: 10,
  },
  selectedContent: {
    flex: 1,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedPCGS: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  changeButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  resultsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  resultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  resultPCGS: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
