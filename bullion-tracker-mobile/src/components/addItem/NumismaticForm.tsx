import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CoinSearchInput } from '../numismatic/CoinSearchInput';
import { GradePicker } from '../numismatic/GradePicker';
import { PriceGuideDisplay } from '../numismatic/PriceGuideDisplay';
import { CertScanner } from './CertScanner';
import { lookupCertNumber, CertLookupResponse, searchCoins } from '../../lib/api';
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

  // Cert lookup state
  const [certLookupLoading, setCertLookupLoading] = useState(false);
  const [certLookupError, setCertLookupError] = useState<string | null>(null);
  const [certLookupSuccess, setCertLookupSuccess] = useState(false);
  const [ngcLookupUrl, setNgcLookupUrl] = useState<string | null>(null);

  // Cert scanner state
  const [scannerVisible, setScannerVisible] = useState(false);

  // Auto-lookup cert number when it changes (PCGS only)
  const lookupCert = useCallback(async () => {
    if (currentGradingService !== 'PCGS' || certNumber.length < 7) {
      return;
    }

    setCertLookupLoading(true);
    setCertLookupError(null);
    setCertLookupSuccess(false);

    try {
      const result: CertLookupResponse = await lookupCertNumber(certNumber, 'pcgs');

      if (!result.success) {
        setCertLookupError(result.error || 'Lookup failed');
        return;
      }

      if (result.data) {
        // Auto-populate grade
        if (result.data.grade) {
          setGrade(result.data.grade);
        }

        // Auto-populate metal type
        if (result.data.metal) {
          setNumismaticMetal(result.data.metal as Metal);
        }

        // Auto-populate price guide value
        if (result.data.priceGuide) {
          setNumismaticValue(result.data.priceGuide.toString());
          setUseCustomValue(true);
        }

        // Try to find matching coin in our database
        if (result.data.matchedCoinId) {
          // Fetch the matched coin to set it
          const coins = await searchCoins(result.data.pcgsNumber.toString());
          const matched = coins.find((c: CoinReference) => c.id === result.data!.matchedCoinId);
          if (matched) {
            setSelectedCoin(matched);
          }
        } else if (result.data.fullName) {
          // Try searching by full name
          const coins = await searchCoins(result.data.fullName);
          if (coins.length > 0) {
            setSelectedCoin(coins[0]);
          }
        }

        setCertLookupSuccess(true);
      }
    } catch {
      setCertLookupError('Network error');
    } finally {
      setCertLookupLoading(false);
    }
  }, [certNumber, currentGradingService]);

  // Debounced cert lookup effect
  useEffect(() => {
    if (currentGradingService === 'PCGS' && certNumber.length >= 7) {
      const timer = setTimeout(() => lookupCert(), 800);
      return () => clearTimeout(timer);
    } else {
      // Reset lookup state when switching services or clearing cert
      setCertLookupSuccess(false);
      setCertLookupError(null);
      setNgcLookupUrl(null);
    }
  }, [certNumber, currentGradingService, lookupCert]);

  // Handle NGC service - set manual lookup URL
  useEffect(() => {
    if (currentGradingService === 'NGC' && certNumber.length >= 7) {
      setNgcLookupUrl(`https://www.ngccoin.com/certlookup/${certNumber}/`);
    } else {
      setNgcLookupUrl(null);
    }
  }, [certNumber, currentGradingService]);

  const openNgcLookup = () => {
    if (ngcLookupUrl) {
      Linking.openURL(ngcLookupUrl);
    }
  };

  // Handle cert scanner result
  const handleCertScan = (scannedCertNumber: string, service: 'pcgs' | 'ngc') => {
    // Set cert number from scanned data
    setCertNumber(scannedCertNumber);
    // Set grading service based on detected service
    setCurrentGradingService(service.toUpperCase() as GradingService);
    // Close scanner
    setScannerVisible(false);
    // The existing debounced lookup will trigger automatically for PCGS
    // For NGC, the ngcLookupUrl effect will set the manual lookup URL
  };

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
        <View style={styles.certSection}>
          <View style={styles.certInputRow}>
            <View style={styles.certInputWrapper}>
              <Input
                label={currentGradingService === 'PCGS' ? 'Certification Number (Autofill)' : 'Certification Number'}
                value={certNumber}
                onChangeText={setCertNumber}
                placeholder="e.g., 12345678"
                keyboardType="number-pad"
              />
            </View>
            {/* Scan button */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setScannerVisible(true)}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
            </TouchableOpacity>
            {certLookupLoading && (
              <View style={styles.certStatusIcon}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            )}
            {certLookupSuccess && !certLookupLoading && (
              <View style={styles.certStatusIcon}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* PCGS autofill badge */}
          {currentGradingService === 'PCGS' && certNumber.length === 0 && (
            <Text style={styles.autofillHint}>
              Enter PCGS cert number to auto-populate coin details
            </Text>
          )}

          {/* Cert lookup error */}
          {certLookupError && (
            <Text style={styles.certError}>{certLookupError}</Text>
          )}

          {/* Cert lookup success */}
          {certLookupSuccess && (
            <Text style={styles.certSuccess}>Coin details auto-filled from PCGS</Text>
          )}

          {/* NGC manual lookup prompt */}
          {ngcLookupUrl && (
            <View style={styles.ngcLookupContainer}>
              <Text style={styles.ngcLookupText}>
                NGC requires manual verification
              </Text>
              <TouchableOpacity style={styles.ngcLookupButton} onPress={openNgcLookup}>
                <Text style={styles.ngcLookupButtonText}>Open NGC Lookup</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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

      {/* Cert Scanner Modal */}
      <CertScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleCertScan}
      />
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
  // Cert lookup styles
  certSection: {
    marginBottom: 16,
  },
  certInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  certInputWrapper: {
    flex: 1,
  },
  certStatusIcon: {
    marginLeft: 8,
    marginBottom: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    marginLeft: 8,
    marginBottom: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonIcon: {
    fontSize: 20,
  },
  successIcon: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
  },
  autofillHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  certError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  certSuccess: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  ngcLookupContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ngcLookupText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 8,
  },
  ngcLookupButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ngcLookupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});
