import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import type { CollectionItem } from '../lib/api';
import { fetchSpotPrices } from '../lib/prices';
import type { Metal, SpotPrices, ItemCategory, GradingService, ProblemType } from '../types';
import Constants from 'expo-constants';
import { CoinSearchInput } from '../components/numismatic/CoinSearchInput';
import { GradePicker } from '../components/numismatic/GradePicker';
import { PriceGuideDisplay } from '../components/numismatic/PriceGuideDisplay';
import type { CoinReference } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItem'>;

type Step = 'category' | 'grading' | 'details';

export function AddItemScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  // Multi-step state
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);

  // Bullion form state
  const [name, setName] = useState('');
  const [metal, setMetal] = useState<Metal>('silver');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Numismatic form state
  const [selectedCoin, setSelectedCoin] = useState<CoinReference | null>(null);
  const [grade, setGrade] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [isGradeEstimated, setIsGradeEstimated] = useState(false);
  const [isProblemCoin, setIsProblemCoin] = useState(false);
  const [problemType, setProblemType] = useState<ProblemType>('cleaned');
  const [numismaticValue, setNumismaticValue] = useState('');
  const [useCustomValue, setUseCustomValue] = useState(false);
  const [numismaticMetal, setNumismaticMetal] = useState<Metal>('silver');

  const resetForm = () => {
    setStep('category');
    setCategory(null);
    setGradingService(null);
    setName('');
    setWeight('');
    setQuantity('1');
    setPurchasePrice('');
    setNotes('');
    setSelectedCoin(null);
    setGrade('');
    setCertNumber('');
    setIsGradeEstimated(false);
    setIsProblemCoin(false);
    setNumismaticValue('');
    setUseCustomValue(false);
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

  const validateBullion = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      Alert.alert('Error', 'Valid weight is required');
      return false;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1) {
      Alert.alert('Error', 'Quantity must be >= 1');
      return false;
    }
    if (!purchasePrice || isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0) {
      Alert.alert('Error', 'Valid purchase price is required');
      return false;
    }
    return true;
  };

  const validateNumismatic = (): boolean => {
    if (!selectedCoin) {
      Alert.alert('Error', 'Please select a coin');
      return false;
    }
    if (!grade) {
      Alert.alert('Error', 'Please select a grade');
      return false;
    }
    if (gradingService !== 'RAW' && !certNumber.trim()) {
      Alert.alert('Error', 'Certification number is required for graded coins');
      return false;
    }
    if (!numismaticValue || isNaN(Number(numismaticValue)) || Number(numismaticValue) < 0) {
      Alert.alert('Error', 'Valid value is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (category === 'BULLION' && !validateBullion()) return;
    if (category === 'NUMISMATIC' && !validateNumismatic()) return;

    setLoading(true);
    try {
      if (category === 'BULLION') {
        // Bullion submission (existing logic)
        const spotPrices = await fetchSpotPrices(Constants.expoConfig?.extra?.metalPriceApiKey || '');
        const currentSpotPrice = spotPrices[metal];

        const itemData = {
          category: 'BULLION' as ItemCategory,
          type: 'itemized' as const,
          title: name.trim(),
          metal,
          weightOz: Number(weight),
          quantity: Number(quantity),
          bookValueType: 'custom' as const,
          customBookValue: Number(purchasePrice),
          spotPriceAtCreation: currentSpotPrice,
          purchaseDate,
          purchasePrice: Number(purchasePrice),
          notes: notes.trim() || undefined,
          images: [],
        };

        await api.createCollectionItem(itemData);
      } else {
        // Numismatic submission
        const itemData = {
          category: 'NUMISMATIC' as ItemCategory,
          coinReferenceId: selectedCoin!.id,
          grade,
          gradingService: gradingService!,
          certificationNumber: gradingService !== 'RAW' ? certNumber.trim() : undefined,
          isGradeEstimated: gradingService === 'RAW' ? isGradeEstimated : false,
          isProblemCoin,
          problemType: isProblemCoin ? problemType : undefined,
          numismaticValue: Number(numismaticValue),
          metal: numismaticMetal,
          purchaseDate,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          notes: notes.trim() || undefined,
          images: [],
        };

        await api.createCollectionItem(itemData);
      }

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

  // Render step indicator
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

  // Render category selection
  const renderCategorySelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>What type of item are you adding?</Text>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategorySelect('BULLION')}
      >
        <Text style={styles.categoryIcon}>🥇</Text>
        <Text style={styles.categoryTitle}>Bullion</Text>
        <Text style={styles.categoryDescription}>
          Bars, rounds, and generic precious metals
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategorySelect('NUMISMATIC')}
      >
        <Text style={styles.categoryIcon}>🪙</Text>
        <Text style={styles.categoryTitle}>Numismatic</Text>
        <Text style={styles.categoryDescription}>
          Collectible coins with grading and value tracking
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render grading service selection
  const renderGradingSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How is your coin graded?</Text>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleGradingSelect('RAW')}
      >
        <Text style={styles.categoryIcon}>📦</Text>
        <Text style={styles.categoryTitle}>RAW (Ungraded)</Text>
        <Text style={styles.categoryDescription}>
          Coin is not professionally graded or slabbed
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleGradingSelect('PCGS')}
      >
        <Text style={styles.categoryIcon}>🏛️</Text>
        <Text style={styles.categoryTitle}>PCGS Graded</Text>
        <Text style={styles.categoryDescription}>
          Professionally graded and encapsulated by PCGS
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleGradingSelect('NGC')}
      >
        <Text style={styles.categoryIcon}>🏛️</Text>
        <Text style={styles.categoryTitle}>NGC Graded</Text>
        <Text style={styles.categoryDescription}>
          Professionally graded and encapsulated by NGC
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render bullion form
  const renderBullionForm = () => (
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

  // Render RAW numismatic form
  const renderRawNumismaticForm = () => (
    <ScrollView style={styles.form}>
      <CoinSearchInput
        onSelect={setSelectedCoin}
        selectedCoin={selectedCoin}
      />

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

      <GradePicker
        value={grade}
        onChange={setGrade}
        isEstimated={isGradeEstimated}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Grade is estimated</Text>
        <Switch
          value={isGradeEstimated}
          onValueChange={setIsGradeEstimated}
        />
      </View>

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

  // Render GRADED numismatic form
  const renderGradedNumismaticForm = () => (
    <ScrollView style={styles.form}>
      <CoinSearchInput
        onSelect={setSelectedCoin}
        selectedCoin={selectedCoin}
      />

      <Input
        label="Certification Number"
        value={certNumber}
        onChangeText={setCertNumber}
        placeholder="e.g., 12345678"
        keyboardType="number-pad"
      />

      <View style={styles.section}>
        <Text style={styles.label}>Grading Service</Text>
        <View style={styles.serviceButtons}>
          <TouchableOpacity
            style={[styles.serviceButton, gradingService === 'PCGS' && styles.serviceButtonActive]}
            onPress={() => setGradingService('PCGS')}
          >
            <Text style={styles.serviceButtonText}>PCGS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.serviceButton, gradingService === 'NGC' && styles.serviceButtonActive]}
            onPress={() => setGradingService('NGC')}
          >
            <Text style={styles.serviceButtonText}>NGC</Text>
          </TouchableOpacity>
        </View>
      </View>

      <GradePicker
        value={grade}
        onChange={setGrade}
      />

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
        {step === 'category' && renderCategorySelection()}
        {step === 'grading' && renderGradingSelection()}
        {step === 'details' && category === 'BULLION' && renderBullionForm()}
        {step === 'details' && category === 'NUMISMATIC' && gradingService === 'RAW' && renderRawNumismaticForm()}
        {step === 'details' && category === 'NUMISMATIC' && gradingService !== 'RAW' && renderGradedNumismaticForm()}
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    flex: 1,
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
