import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { fetchSpotPrices } from '../lib/prices';
import type { ItemCategory, GradingService } from '../types';
import Constants from 'expo-constants';
import {
  CategoryStep,
  GradingStep,
  BullionForm,
  NumismaticForm,
  type BullionFormData,
  type NumismaticFormData,
} from '../components/addItem';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItem'>;

type Step = 'category' | 'grading' | 'details';

export function AddItemScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);

  const resetForm = () => {
    setStep('category');
    setCategory(null);
    setGradingService(null);
  };

  const handleCategorySelect = (cat: ItemCategory) => {
    setCategory(cat);
    if (cat === 'BULLION') {
      setStep('details');
    } else {
      setStep('grading');
    }
  };

  const handleGradingSelect = (service: GradingService) => {
    setGradingService(service);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      if (category === 'NUMISMATIC') {
        setStep('grading');
      } else {
        setStep('category');
      }
    } else if (step === 'grading') {
      setStep('category');
    }
  };

  const handleBullionSubmit = async (data: BullionFormData) => {
    if (!data.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!data.weight || isNaN(Number(data.weight)) || Number(data.weight) <= 0) {
      Alert.alert('Error', 'Valid weight is required');
      return;
    }
    if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) < 1) {
      Alert.alert('Error', 'Quantity must be >= 1');
      return;
    }
    if (!data.purchasePrice || isNaN(Number(data.purchasePrice)) || Number(data.purchasePrice) < 0) {
      Alert.alert('Error', 'Valid purchase price is required');
      return;
    }

    setLoading(true);
    try {
      const spotPrices = await fetchSpotPrices(Constants.expoConfig?.extra?.metalPriceApiKey || '');
      const currentSpotPrice = spotPrices[data.metal];

      const itemData = {
        category: 'BULLION' as ItemCategory,
        type: 'itemized' as const,
        title: data.name.trim(),
        metal: data.metal,
        weightOz: Number(data.weight),
        quantity: Number(data.quantity),
        bookValueType: 'custom' as const,
        customBookValue: Number(data.purchasePrice),
        spotPriceAtCreation: currentSpotPrice,
        purchaseDate: data.purchaseDate,
        purchasePrice: Number(data.purchasePrice),
        notes: data.notes.trim() || undefined,
        images: [],
      };

      await api.createCollectionItem(itemData);
      Alert.alert('Success', 'Item added to collection');
      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleNumismaticSubmit = async (data: NumismaticFormData) => {
    if (!data.selectedCoin) {
      Alert.alert('Error', 'Please select a coin');
      return;
    }
    if (!data.grade) {
      Alert.alert('Error', 'Please select a grade');
      return;
    }
    if (gradingService !== 'RAW' && !data.certNumber.trim()) {
      Alert.alert('Error', 'Certification number is required for graded coins');
      return;
    }
    if (!data.numismaticValue || isNaN(Number(data.numismaticValue)) || Number(data.numismaticValue) < 0) {
      Alert.alert('Error', 'Valid value is required');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        category: 'NUMISMATIC' as ItemCategory,
        coinReferenceId: data.selectedCoin.id,
        grade: data.grade,
        gradingService: gradingService!,
        certificationNumber: gradingService !== 'RAW' ? data.certNumber.trim() : undefined,
        isGradeEstimated: gradingService === 'RAW' ? data.isGradeEstimated : false,
        isProblemCoin: data.isProblemCoin,
        problemType: data.isProblemCoin ? data.problemType : undefined,
        numismaticValue: Number(data.numismaticValue),
        metal: data.numismaticMetal,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        notes: data.notes.trim() || undefined,
        images: [],
      };

      await api.createCollectionItem(itemData);
      Alert.alert('Success', 'Item added to collection');
      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = category === 'NUMISMATIC' ? ['Category', 'Grading', 'Details'] : ['Category', 'Details'];
    const currentIndex = step === 'category' ? 0 : step === 'grading' ? 1 : category === 'NUMISMATIC' ? 2 : 1;

    return (
      <View style={styles.stepIndicator}>
        {steps.map((label, index) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepCircle, index <= currentIndex && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, index <= currentIndex && styles.stepNumberActive]}>
                {index + 1}
              </Text>
            </View>
            <Text style={styles.stepLabel}>{label}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Item</Text>
        {step !== 'category' && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderStepIndicator()}

      <Card style={styles.card}>
        {step === 'category' && <CategoryStep onSelect={handleCategorySelect} />}
        {step === 'grading' && <GradingStep onSelect={handleGradingSelect} />}
        {step === 'details' && category === 'BULLION' && (
          <BullionForm onSubmit={handleBullionSubmit} loading={loading} />
        )}
        {step === 'details' && category === 'NUMISMATIC' && gradingService && (
          <NumismaticForm
            gradingService={gradingService}
            onSubmit={handleNumismaticSubmit}
            loading={loading}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#3B82F6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  card: {
    margin: 16,
    flex: 1,
  },
});
