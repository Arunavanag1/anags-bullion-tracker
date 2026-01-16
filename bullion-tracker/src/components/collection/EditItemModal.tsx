'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from './ImageUploader';
import { useUpdateItem } from '@/hooks/useCollection';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import type { CollectionItem, Metal, BookValueType } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CollectionItem;
}

export function EditItemModal({ isOpen, onClose, item }: EditItemModalProps) {
  const updateItem = useUpdateItem();
  const { data: prices } = useSpotPrices();

  const isNumismatic = item.category === 'NUMISMATIC';

  // Helper to safely access itemized properties
  const getItemProp = <T,>(prop: string, defaultVal: T): T => {
    if ('title' in item) {
      return (item as unknown as Record<string, unknown>)[prop] as T ?? defaultVal;
    }
    return defaultVal;
  };

  // Initialize form state from item
  const [title, setTitle] = useState(getItemProp('title', ''));
  const [metal, setMetal] = useState<Metal>(item.metal);
  const [quantity, setQuantity] = useState(item.quantity ?? 1);
  const [weightOz, setWeightOz] = useState(item.weightOz || 0);

  // Numismatic-specific fields
  const [grade, setGrade] = useState(getItemProp('grade', ''));
  const [gradingService, setGradingService] = useState(getItemProp('gradingService', ''));
  const [certNumber, setCertNumber] = useState(getItemProp('certNumber', ''));
  const [numismaticValue, setNumismaticValue] = useState(getItemProp<number | undefined>('numismaticValue', undefined)?.toString() || '');

  // Common fields
  const [notes, setNotes] = useState(item.notes || '');
  const [bookValueType, setBookValueType] = useState<BookValueType>(item.bookValueType);
  const [customBookValue, setCustomBookValue] = useState(
    item.customBookValue?.toString() || ''
  );
  const [premiumPercent, setPremiumPercent] = useState(
    getItemProp<number | undefined>('premiumPercent', 0)?.toString() || '0'
  );
  const [purchasePrice, setPurchasePrice] = useState(
    getItemProp<number | undefined>('purchasePrice', undefined)?.toString() || ''
  );
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const pd = getItemProp<Date | string | undefined>('purchaseDate', undefined);
    if (!pd) return new Date().toISOString().split('T')[0];
    return (pd instanceof Date ? pd.toISOString() : pd).split('T')[0];
  });
  const [images, setImages] = useState<string[]>(item.images || []);

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setTitle(getItemProp('title', ''));
      setMetal(item.metal);
      setQuantity(item.quantity ?? 1);
      setWeightOz(item.weightOz || 0);
      setGrade(getItemProp('grade', ''));
      setGradingService(getItemProp('gradingService', ''));
      setCertNumber(getItemProp('certNumber', ''));
      setNumismaticValue(getItemProp<number | undefined>('numismaticValue', undefined)?.toString() || '');
      setNotes(item.notes || '');
      setBookValueType(item.bookValueType);
      setCustomBookValue(item.customBookValue?.toString() || '');
      setPremiumPercent(getItemProp<number | undefined>('premiumPercent', 0)?.toString() || '0');
      setPurchasePrice(getItemProp<number | undefined>('purchasePrice', undefined)?.toString() || '');
      const pd = getItemProp<Date | string | undefined>('purchaseDate', undefined);
      setPurchaseDate(pd
        ? (pd instanceof Date ? pd.toISOString() : pd).split('T')[0]
        : new Date().toISOString().split('T')[0]);
      setImages(item.images || []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const currentSpotPrice = prices?.[metal]?.pricePerOz || 0;
  const meltValue = weightOz * quantity * currentSpotPrice;
  const premiumMultiplier = 1 + ((parseFloat(premiumPercent) || 0) / 100);
  const spotValue = meltValue * premiumMultiplier;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      title,
      metal,
      weightOz,
      quantity,
      purchaseDate: new Date(purchaseDate),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      notes: notes || undefined,
      images,
    };

    if (isNumismatic) {
      // Numismatic items use numismaticValue
      data.grade = grade || undefined;
      data.gradingService = gradingService || undefined;
      data.certNumber = certNumber || undefined;
      data.numismaticValue = numismaticValue ? parseFloat(numismaticValue) : undefined;
      data.bookValueType = 'guide_price';
    } else {
      // Bullion items use spot or custom book value
      data.bookValueType = bookValueType;
      data.customBookValue = bookValueType === 'custom' ? parseFloat(customBookValue) : undefined;
      data.premiumPercent = bookValueType === 'spot_premium' ? parseFloat(premiumPercent) || 0 : undefined;
    }

    try {
      await updateItem.mutateAsync({ id: item.id, data });
      onClose();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${isNumismatic ? 'Numismatic' : 'Bullion'} Item`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category indicator */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isNumismatic
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {isNumismatic ? 'NUMISMATIC' : 'BULLION'}
          </span>
        </div>

        {/* Metal Selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Metal *</label>
          <div className="flex gap-2">
            {(['gold', 'silver', 'platinum'] as Metal[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  metal === m
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border text-text-secondary hover:border-accent-primary/50'
                }`}
                onClick={() => setMetal(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isNumismatic ? "e.g., 1909-S VDB Lincoln Cent" : "e.g., 2021 Silver Eagle"}
          required
        />

        {/* Weight and Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight (oz) *"
            type="number"
            step="0.001"
            value={weightOz}
            onChange={(e) => setWeightOz(parseFloat(e.target.value) || 0)}
            required
          />
          <Input
            label="Quantity *"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        {/* Numismatic-specific fields */}
        {isNumismatic && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., MS65, VF30"
              />
              <Input
                label="Grading Service"
                value={gradingService}
                onChange={(e) => setGradingService(e.target.value)}
                placeholder="e.g., PCGS, NGC"
              />
            </div>
            <Input
              label="Cert Number"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              placeholder="Certification number"
            />
            <Input
              label="Numismatic Value *"
              type="number"
              step="0.01"
              value={numismaticValue}
              onChange={(e) => setNumismaticValue(e.target.value)}
              placeholder="Current market value"
              required
            />
          </>
        )}

        {/* Bullion Book Value - only for non-numismatic */}
        {!isNumismatic && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Book Value *
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="spot"
                  checked={bookValueType === 'spot_premium'}
                  onChange={() => setBookValueType('spot_premium')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-text-primary">
                  Use Spot + Premium{' '}
                  <span className="font-mono text-sm">
                    ({formatCurrency(spotValue)}
                    {parseFloat(premiumPercent) !== 0 && (
                      <span className={parseFloat(premiumPercent) > 0 ? 'text-green-600' : 'text-red-600'}>
                        {' '}{parseFloat(premiumPercent) > 0 ? '+' : ''}{premiumPercent}%
                      </span>
                    )})
                  </span>
                </span>
              </label>
              {bookValueType === 'spot_premium' && (
                <div className="ml-6">
                  <Input
                    label="Premium/Discount %"
                    type="number"
                    step="0.1"
                    value={premiumPercent}
                    onChange={(e) => setPremiumPercent(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Positive for premium (e.g., 5), negative for discount (e.g., -3)
                  </p>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="custom"
                  checked={bookValueType === 'custom'}
                  onChange={() => setBookValueType('custom')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-text-primary">Custom Value</span>
              </label>
              {bookValueType === 'custom' && (
                <Input
                  type="number"
                  step="0.01"
                  value={customBookValue}
                  onChange={(e) => setCustomBookValue(e.target.value)}
                  placeholder="Enter custom book value"
                  required
                />
              )}
            </div>
          </div>
        )}

        {/* Purchase Price and Date */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Purchase Price"
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="What you paid"
          />
          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
            rows={3}
            placeholder="Optional notes..."
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Photos</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateItem.isPending || (!isNumismatic && !currentSpotPrice)}
            className="flex-1"
          >
            {updateItem.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
