import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import type { CollectionItem } from '../lib/api';
import { fetchSpotPrices } from '../lib/prices';
import type { ItemCategory, GradingService, Metal, ProblemType, CoinReference } from '../types';
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

export function AddItemScreen({ navigation, route }: Props) {
  const itemId = route.params?.itemId;
  const isEditing = !!itemId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [step, setStep] = useState<Step>(isEditing ? 'details' : 'category');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);

  // Form initial data for editing
  const [bullionInitialData, setBullionInitialData] = useState<BullionFormData | undefined>();
  const [numismaticInitialData, setNumismaticInitialData] = useState<NumismaticFormData | undefined>();
  const [existingItem, setExistingItem] = useState<CollectionItem | null>(null);

  // Load existing item data when editing
  useEffect(() => {
    if (itemId) {
      loadExistingItem(itemId);
    }
  }, [itemId]);

  const loadExistingItem = async (id: string) => {
    try {
      setInitialLoading(true);
      const item = await api.getCollectionItem(id);
      setExistingItem(item);
      setCategory(item.category as ItemCategory);

      if (item.category === 'BULLION') {
        setBullionInitialData({
          name: item.title || '',
          metal: (item.metal as Metal) || 'silver',
          weight: item.weightOz?.toString() || '',
          quantity: item.quantity?.toString() || '1',
          purchasePrice: item.customBookValue?.toString() || item.purchasePrice?.toString() || '',
          premiumPercent: item.premiumPercent?.toString() || '0',
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: item.notes || '',
          images: item.images || [],
        });
      } else if (item.category === 'NUMISMATIC') {
        setGradingService((item.gradingService as GradingService) || 'RAW');

        // For numismatic items, we need to reconstruct the coin reference
        // This is a simplified version - in practice you might fetch the full coin reference
        const coinRef: CoinReference | null = item.coinReferenceId ? {
          id: item.coinReferenceId,
          pcgsNumber: '',
          fullName: item.title || '',
          series: '',
          year: 0,
          mintMark: null,
          denomination: '',
          metal: item.metal || 'silver',
          weightOz: item.weightOz || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : null;

        setNumismaticInitialData({
          selectedCoin: coinRef,
          customCoinName: !item.coinReferenceId && item.title ? item.title : '',
          grade: item.grade || '',
          certNumber: item.certificationNumber || '',
          isGradeEstimated: item.isGradeEstimated || false,
          isProblemCoin: item.isProblemCoin || false,
          problemType: (item.problemType as ProblemType) || 'cleaned',
          numismaticValue: item.numismaticValue?.toString() || '',
          numismaticMetal: (item.metal as Metal) || 'silver',
          purchasePrice: item.purchasePrice?.toString() || '',
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: item.notes || '',
          images: item.images || [],
        });
      }
    } catch (error) {
      console.error('Failed to load item:', error);
      Alert.alert('Error', 'Failed to load item details');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const resetForm = () => {
    setStep('category');
    setCategory(null);
    setGradingService(null);
    setBullionInitialData(undefined);
    setNumismaticInitialData(undefined);
    setExistingItem(null);
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
    if (isEditing) {
      navigation.goBack();
      return;
    }

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
      if (isEditing && itemId) {
        // Update existing item
        const updateData = {
          title: data.name.trim(),
          metal: data.metal,
          weightOz: Number(data.weight),
          quantity: Number(data.quantity),
          customBookValue: Number(data.purchasePrice),
          premiumPercent: data.premiumPercent ? Number(data.premiumPercent) : 0,
          purchaseDate: data.purchaseDate,
          purchasePrice: Number(data.purchasePrice),
          notes: data.notes.trim() || undefined,
          images: data.images,
        };

        await api.updateCollectionItem(itemId, updateData);
        Alert.alert('Success', 'Item updated successfully');
      } else {
        // Create new item
        const spotPrices = await fetchSpotPrices(Constants.expoConfig?.extra?.metalPriceApiKey || '');
        const currentSpotPrice = spotPrices[data.metal];

        const itemData = {
          category: 'BULLION' as ItemCategory,
          type: 'itemized' as const,
          title: data.name.trim(),
          metal: data.metal,
          weightOz: Number(data.weight),
          quantity: Number(data.quantity),
          bookValueType: 'spot_premium' as const,
          premiumPercent: data.premiumPercent ? Number(data.premiumPercent) : 0,
          spotPriceAtCreation: currentSpotPrice,
          purchaseDate: data.purchaseDate,
          purchasePrice: Number(data.purchasePrice),
          notes: data.notes.trim() || undefined,
          images: data.images,
        };

        await api.createCollectionItem(itemData);
        Alert.alert('Success', 'Item added to collection');
      }

      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleNumismaticSubmit = async (data: NumismaticFormData) => {
    if (!isEditing && !data.selectedCoin && !data.customCoinName?.trim()) {
      Alert.alert('Error', 'Please enter a coin name or select from search results');
      return;
    }
    if (!data.grade) {
      Alert.alert('Error', 'Please enter a grade');
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
      if (isEditing && itemId) {
        // Update existing item
        const updateData: any = {
          grade: data.grade,
          certificationNumber: gradingService !== 'RAW' ? data.certNumber.trim() : undefined,
          isGradeEstimated: gradingService === 'RAW' ? data.isGradeEstimated : false,
          isProblemCoin: data.isProblemCoin,
          problemType: data.isProblemCoin ? data.problemType : undefined,
          numismaticValue: Number(data.numismaticValue),
          metal: data.numismaticMetal,
          purchaseDate: data.purchaseDate,
          purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
          notes: data.notes.trim() || undefined,
          images: data.images,
        };

        await api.updateCollectionItem(itemId, updateData);
        Alert.alert('Success', 'Item updated successfully');
      } else {
        // Create new item
        const itemData: any = {
          category: 'NUMISMATIC' as ItemCategory,
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
          images: data.images,
        };

        // Use selected coin ID if available, otherwise use custom coin name as title
        if (data.selectedCoin) {
          itemData.coinReferenceId = data.selectedCoin.id;
        } else if (data.customCoinName?.trim()) {
          itemData.title = data.customCoinName.trim();
        }

        await api.createCollectionItem(itemData);
        Alert.alert('Success', 'Item added to collection');
      }

      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    if (isEditing) {
      return null; // Don't show step indicator when editing
    }

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

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>
        {(step !== 'category' || isEditing) && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{isEditing ? '← Cancel' : '← Back'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderStepIndicator()}

      <Card style={styles.card}>
        {step === 'category' && !isEditing && <CategoryStep onSelect={handleCategorySelect} />}
        {step === 'grading' && !isEditing && <GradingStep onSelect={handleGradingSelect} />}
        {step === 'details' && category === 'BULLION' && (
          <BullionForm
            onSubmit={handleBullionSubmit}
            loading={loading}
            initialData={bullionInitialData}
            isEditing={isEditing}
          />
        )}
        {step === 'details' && category === 'NUMISMATIC' && gradingService && (
          <NumismaticForm
            gradingService={gradingService}
            onSubmit={handleNumismaticSubmit}
            loading={loading}
            initialData={numismaticInitialData}
            isEditing={isEditing}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
