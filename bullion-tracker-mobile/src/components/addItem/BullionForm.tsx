import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Metal } from '../../types';

/**
 * BullionForm - Details form for bullion items
 *
 * Collects name, metal type, weight, quantity, price, notes, and photos.
 * Manages its own form state and calls onSubmit with complete data.
 * Supports both creating new items and editing existing ones.
 */
export interface BullionFormData {
  name: string;
  metal: Metal;
  weight: string;
  quantity: string;
  purchasePrice: string;
  premiumPercent: string;
  purchaseDate: string;
  notes: string;
  images: string[];
}

interface BullionFormProps {
  onSubmit: (data: BullionFormData) => Promise<void>;
  loading: boolean;
  initialData?: BullionFormData;
  isEditing?: boolean;
}

export function BullionForm({ onSubmit, loading, initialData, isEditing = false }: BullionFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [metal, setMetal] = useState<Metal>(initialData?.metal || 'silver');
  const [weight, setWeight] = useState(initialData?.weight || '');
  const [quantity, setQuantity] = useState(initialData?.quantity || '1');
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchasePrice || '');
  const [premiumPercent, setPremiumPercent] = useState(initialData?.premiumPercent || '0');
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchaseDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  // Update form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setMetal(initialData.metal);
      setWeight(initialData.weight);
      setQuantity(initialData.quantity);
      setPurchasePrice(initialData.purchasePrice);
      setPremiumPercent(initialData.premiumPercent || '0');
      setPurchaseDate(initialData.purchaseDate);
      setNotes(initialData.notes);
      setImages(initialData.images || []);
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
      name,
      metal,
      weight,
      quantity,
      purchasePrice,
      premiumPercent,
      purchaseDate,
      notes,
      images,
    });
  };

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
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
        label="Premium/Discount %"
        value={premiumPercent}
        onChangeText={setPremiumPercent}
        keyboardType="decimal-pad"
        placeholder="0 (e.g., 5 for 5% premium, -3 for 3% discount)"
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
    paddingBottom: 120,
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
