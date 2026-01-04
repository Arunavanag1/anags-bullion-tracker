import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { RootStackParamList } from '../../App';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import type { CollectionItem } from '../lib/api';
import { fetchSpotPrices } from '../lib/prices';
import type { Metal, SpotPrices } from '../types';
import Constants from 'expo-constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItem'>;

export function AddItemScreen({ navigation, route }: Props) {
  const { itemId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [existingItem, setExistingItem] = useState<CollectionItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [metal, setMetal] = useState<Metal>('gold');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purity, setPurity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  const loadItem = async () => {
    if (!itemId) return;

    try {
      const item = await api.getCollectionItem(itemId);
      if (item) {
        setExistingItem(item);
        // Map API fields to form fields
        setName(item.type === 'itemized' && item.title ? item.title : '');
        setMetal(item.metal);
        setWeight(item.weightOz.toString());
        setQuantity(item.quantity.toString());
        setPurity('100'); // API doesn't store purity, assume 100% for now

        // Calculate purchase price from book value
        const purchaseValue = item.customBookValue || (item.weightOz * item.quantity * item.spotPriceAtCreation);
        setPurchasePrice(purchaseValue.toString());

        // Use purchaseDate if available, otherwise fallback to createdAt
        setPurchaseDate(item.purchaseDate ? item.purchaseDate.split('T')[0] : item.createdAt.split('T')[0]);
        setNotes(item.notes || '');
        setImageUri(item.images && item.images.length > 0 ? item.images[0] : undefined);
      }
    } catch (error) {
      console.error('Failed to load item:', error);
      Alert.alert('Error', 'Failed to load item');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      newErrors.weight = 'Valid weight is required';
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1 || !Number.isInteger(Number(quantity))) {
      newErrors.quantity = 'Quantity must be a whole number >= 1';
    }
    if (!purchasePrice || isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0) {
      newErrors.purchasePrice = 'Valid purchase price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Get current spot prices
      const spotPrices = await fetchSpotPrices(Constants.expoConfig?.extra?.metalPriceApiKey || '');
      const currentSpotPrice = spotPrices[metal];

      // Calculate melt value at current spot price
      const pureWeight = Number(weight) * Number(quantity);
      const meltValue = pureWeight * currentSpotPrice;

      // Determine book value type
      const purchaseValue = Number(purchasePrice);
      const bookValueType: 'custom' | 'spot' = purchaseValue > 0 ? 'custom' : 'spot';

      // Convert image to base64 if exists (with compression)
      let imageBase64: string | undefined;
      if (imageUri && imageUri.startsWith('file://')) {
        try {
          // Resize and compress the image to reduce payload size
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 1200 } }], // Resize to max 1200px width
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );

          // Convert compressed image to base64
          imageBase64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
            encoding: 'base64',
          });
          // Create data URL
          imageBase64 = `data:image/jpeg;base64,${imageBase64}`;
        } catch (error) {
          console.error('Failed to convert image:', error);
          Alert.alert('Error', 'Failed to process image. Please try a smaller image.');
        }
      } else if (imageUri && imageUri.startsWith('http')) {
        // Already a URL, keep as is
        imageBase64 = imageUri;
      }

      const itemData = {
        type: 'itemized' as const,
        title: name.trim(),
        metal,
        weightOz: Number(weight),
        quantity: Number(quantity),
        bookValueType,
        customBookValue: bookValueType === 'custom' ? purchaseValue : undefined,
        spotPriceAtCreation: currentSpotPrice,
        purchaseDate: purchaseDate,
        notes: notes.trim() || undefined,
        images: imageBase64 ? [imageBase64] : [],
      };

      if (itemId && existingItem) {
        await api.updateCollectionItem(itemId, itemData);
      } else {
        await api.createCollectionItem(itemData);
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', error.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to add photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Card>
        {/* Image Picker */}
        <View style={{ marginBottom: 20, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Add Photo', 'Choose photo source', [
                { text: 'Camera', onPress: takePhoto },
                { text: 'Photo Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              backgroundColor: '#F5F5F5',
              borderWidth: 2,
              borderColor: '#F5E6DC',
              borderStyle: 'dashed',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 40 }}>📷</Text>
            )}
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#8B6B61', marginTop: 8 }}>
            Tap to {imageUri ? 'change' : 'add'} photo
          </Text>
        </View>

        {/* Name */}
        <Input
          label="Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g., American Gold Eagle 1oz"
          error={errors.name}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Metal Type */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D1B1B', marginBottom: 8 }}>
            Metal Type *
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['gold', 'silver', 'platinum'] as Metal[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMetal(m)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: metal === m ? '#E76F51' : '#F5E6DC',
                  backgroundColor: metal === m ? '#FFE8D6' : '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: metal === m ? '#E76F51' : '#8B6B61',
                    textTransform: 'capitalize',
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weight */}
        <Input
          label="Weight per item (troy oz) *"
          value={weight}
          onChangeText={setWeight}
          placeholder="1.0"
          keyboardType="decimal-pad"
          error={errors.weight}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Quantity */}
        <Input
          label="Quantity *"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="1"
          keyboardType="number-pad"
          error={errors.quantity}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Note: Purity removed - backend assumes 100% pure weight */}

        {/* Purchase Price */}
        <Input
          label="Purchase Price (USD) *"
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          placeholder="2000.00"
          keyboardType="decimal-pad"
          error={errors.purchasePrice}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Purchase Date */}
        <Input
          label="Purchase Date *"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
          error={errors.purchaseDate}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Notes */}
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details..."
          multiline
          numberOfLines={3}
          containerStyle={{ marginBottom: 20 }}
        />

        {/* Submit Button */}
        <Button onPress={handleSubmit} loading={loading} disabled={loading}>
          {itemId ? 'Update Item' : 'Add Item'}
        </Button>
      </Card>
    </ScrollView>
  );
}
