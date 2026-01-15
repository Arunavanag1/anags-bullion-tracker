import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Metal } from '../../types';

/**
 * BullionForm - Details form for bullion items
 *
 * Collects name, metal type, weight, quantity, price, and notes.
 * Manages its own form state and calls onSubmit with complete data.
 *
 * @example
 * <BullionForm onSubmit={handleBullionSubmit} loading={isSubmitting} />
 */
export interface BullionFormData {
  name: string;
  metal: Metal;
  weight: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: string;
  notes: string;
}

interface BullionFormProps {
  onSubmit: (data: BullionFormData) => Promise<void>;
  loading: boolean;
}

export function BullionForm({ onSubmit, loading }: BullionFormProps) {
  const [name, setName] = useState('');
  const [metal, setMetal] = useState<Metal>('silver');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      name,
      metal,
      weight,
      quantity,
      purchasePrice,
      purchaseDate,
      notes,
    });
  };

  return (
    <ScrollView style={styles.form}>
      <Input
        label="Description"
        value={name}
        onChangeText={setName}
        placeholder="e.g., APMEX 10 oz Silver Bar"
      />

      <View style={styles.section}>
        <Text style={styles.label}>Metal Type</Text>
        <View style={styles.metalButtons}>
          {(['gold', 'silver', 'platinum'] as Metal[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.metalButton, metal === m && styles.metalButtonActive]}
              onPress={() => setMetal(m)}
            >
              <Text style={[styles.metalButtonText, metal === m && styles.metalButtonTextActive]}>
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        label="Weight (oz)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="e.g., 10"
      />

      <Input
        label="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
        placeholder="1"
      />

      <Input
        label="Purchase Price ($)"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Input
        label="Purchase Date"
        value={purchaseDate}
        onChangeText={setPurchaseDate}
        placeholder="YYYY-MM-DD"
      />

      <Input
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Add any notes..."
      />

      <Button
        onPress={handleSubmit}
        disabled={loading}
        loading={loading}
      >
        {loading ? 'Adding...' : 'Add to Collection'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  metalButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  metalButtonActive: {
    backgroundColor: '#3B82F6',
  },
  metalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  metalButtonTextActive: {
    color: '#FFFFFF',
  },
});
