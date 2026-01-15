import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CoinSearchInput } from '../numismatic/CoinSearchInput';
import { GradePicker } from '../numismatic/GradePicker';
import { PriceGuideDisplay } from '../numismatic/PriceGuideDisplay';
import type { Metal, GradingService, ProblemType, CoinReference } from '../../types';

/**
 * NumismaticForm - Details form for numismatic (collectible coin) items
 *
 * Adapts fields based on grading service: RAW shows estimated grade toggle,
 * PCGS/NGC shows certification number. Includes coin search, grade picker,
 * price guide integration, problem coin designation, and photo upload.
 * Supports both creating new items and editing existing ones.
 */
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
  images: string[];
}

interface NumismaticFormProps {
  gradingService: GradingService;
  onSubmit: (data: NumismaticFormData) => Promise<void>;
  loading: boolean;
  initialData?: NumismaticFormData;
  isEditing?: boolean;
}

export function NumismaticForm({ gradingService, onSubmit, loading, initialData, isEditing = false }: NumismaticFormProps) {
  const [selectedCoin, setSelectedCoin] = useState<CoinReference | null>(initialData?.selectedCoin || null);
  const [grade, setGrade] = useState(initialData?.grade || '');
  const [certNumber, setCertNumber] = useState(initialData?.certNumber || '');
  const [isGradeEstimated, setIsGradeEstimated] = useState(initialData?.isGradeEstimated || false);
  const [isProblemCoin, setIsProblemCoin] = useState(initialData?.isProblemCoin || false);
  const [problemType, setProblemType] = useState<ProblemType>(initialData?.problemType || 'cleaned');
  const [numismaticValue, setNumismaticValue] = useState(initialData?.numismaticValue || '');
  const [useCustomValue, setUseCustomValue] = useState(isEditing); // Default to custom value when editing
  const [numismaticMetal, setNumismaticMetal] = useState<Metal>(initialData?.numismaticMetal || 'silver');
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchasePrice || '');
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchaseDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [currentGradingService, setCurrentGradingService] = useState<GradingService>(gradingService);

  // Update form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setSelectedCoin(initialData.selectedCoin);
      setGrade(initialData.grade);
      setCertNumber(initialData.certNumber);
      setIsGradeEstimated(initialData.isGradeEstimated);
      setIsProblemCoin(initialData.isProblemCoin);
      setProblemType(initialData.problemType);
      setNumismaticValue(initialData.numismaticValue);
      setNumismaticMetal(initialData.numismaticMetal);
      setPurchasePrice(initialData.purchasePrice);
      setPurchaseDate(initialData.purchaseDate);
      setNotes(initialData.notes);
      setImages(initialData.images || []);
      setUseCustomValue(true);
    }
  }, [initialData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

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
      images,
    });
  };

  const isRaw = gradingService === 'RAW';

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
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

      {/* Photo Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Photos</Text>
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 4 && (
            <View style={styles.addPhotoButtons}>
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Text style={styles.addPhotoIcon}>🖼</Text>
                <Text style={styles.addPhotoText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
        >
          {loading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add to Collection')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 40,
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 10,
    color: '#6B7280',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
});
