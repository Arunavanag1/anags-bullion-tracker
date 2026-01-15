import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CoinSearchInput } from '../numismatic/CoinSearchInput';
import { GradePicker } from '../numismatic/GradePicker';
import { PriceGuideDisplay } from '../numismatic/PriceGuideDisplay';
import type { Metal, GradingService, ProblemType, CoinReference } from '../../types';

export interface NumismaticFormData {
  selectedCoin: CoinReference | null;
  grade: string;
  certNumber: string;
  isGradeEstimated: boolean;
  isProblemCoin: boolean;
  problemType: ProblemType;
  numismaticValue: string;
  numismaticMetal: Metal;
  purchasePrice: string;
  purchaseDate: string;
  notes: string;
}

interface NumismaticFormProps {
  gradingService: GradingService;
  onSubmit: (data: NumismaticFormData) => Promise<void>;
  loading: boolean;
}

export function NumismaticForm({ gradingService, onSubmit, loading }: NumismaticFormProps) {
  const [selectedCoin, setSelectedCoin] = useState<CoinReference | null>(null);
  const [grade, setGrade] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [isGradeEstimated, setIsGradeEstimated] = useState(false);
  const [isProblemCoin, setIsProblemCoin] = useState(false);
  const [problemType, setProblemType] = useState<ProblemType>('cleaned');
  const [numismaticValue, setNumismaticValue] = useState('');
  const [useCustomValue, setUseCustomValue] = useState(false);
  const [numismaticMetal, setNumismaticMetal] = useState<Metal>('silver');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [currentGradingService, setCurrentGradingService] = useState<GradingService>(gradingService);

  const handleSubmit = () => {
    onSubmit({
      selectedCoin,
      grade,
      certNumber,
      isGradeEstimated,
      isProblemCoin,
      problemType,
      numismaticValue,
      numismaticMetal,
      purchasePrice,
      purchaseDate,
      notes,
    });
  };

  const isRaw = gradingService === 'RAW';

  return (
    <ScrollView style={styles.form}>
      <CoinSearchInput
        onSelect={setSelectedCoin}
        selectedCoin={selectedCoin}
      />

      {isRaw && (
        <View style={styles.section}>
          <Text style={styles.label}>Metal Type</Text>
          <View style={styles.metalButtons}>
            {(['gold', 'silver', 'platinum'] as Metal[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.metalButton, numismaticMetal === m && styles.metalButtonActive]}
                onPress={() => setNumismaticMetal(m)}
              >
                <Text style={[styles.metalButtonText, numismaticMetal === m && styles.metalButtonTextActive]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!isRaw && (
        <Input
          label="Certification Number"
          value={certNumber}
          onChangeText={setCertNumber}
          placeholder="e.g., 12345678"
          keyboardType="number-pad"
        />
      )}

      {!isRaw && (
        <View style={styles.section}>
          <Text style={styles.label}>Grading Service</Text>
          <View style={styles.serviceButtons}>
            <TouchableOpacity
              style={[styles.serviceButton, currentGradingService === 'PCGS' && styles.serviceButtonActive]}
              onPress={() => setCurrentGradingService('PCGS')}
            >
              <Text style={styles.serviceButtonText}>PCGS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.serviceButton, currentGradingService === 'NGC' && styles.serviceButtonActive]}
              onPress={() => setCurrentGradingService('NGC')}
            >
              <Text style={styles.serviceButtonText}>NGC</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <GradePicker
        value={grade}
        onChange={setGrade}
        isEstimated={isRaw ? isGradeEstimated : undefined}
      />

      {isRaw && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Grade is estimated</Text>
          <Switch
            value={isGradeEstimated}
            onValueChange={setIsGradeEstimated}
          />
        </View>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Problem coin</Text>
        <Switch
          value={isProblemCoin}
          onValueChange={setIsProblemCoin}
        />
      </View>

      {isProblemCoin && (
        <View style={styles.section}>
          <Text style={styles.label}>Problem Type</Text>
          <View style={styles.problemButtons}>
            {(['cleaned', 'damaged', 'holed', 'repaired'] as ProblemType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.problemButton, problemType === type && styles.problemButtonActive]}
                onPress={() => setProblemType(type)}
              >
                <Text style={styles.problemButtonText}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <PriceGuideDisplay
        coinId={selectedCoin?.id}
        grade={grade}
        value={numismaticValue}
        onChange={setNumismaticValue}
        useCustom={useCustomValue}
        onToggleCustom={setUseCustomValue}
      />

      <Input
        label="Purchase Price ($)"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        keyboardType="decimal-pad"
        placeholder="What you paid"
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  problemButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  problemButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  problemButtonActive: {
    backgroundColor: '#EF4444',
  },
  problemButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  serviceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  serviceButtonActive: {
    backgroundColor: '#3B82F6',
  },
  serviceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});
