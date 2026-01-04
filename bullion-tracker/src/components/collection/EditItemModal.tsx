'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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

  // Initialize form state from item
  const [title, setTitle] = useState(item.type === 'itemized' ? item.title : '');
  const [metal, setMetal] = useState<Metal>(item.metal);
  const [quantity, setQuantity] = useState('quantity' in item ? item.quantity : 1);
  const [weightOz, setWeightOz] = useState(item.weightOz);
  const [grade, setGrade] = useState(item.type === 'itemized' && item.grade ? item.grade : '');
  const [gradingService, setGradingService] = useState(
    item.type === 'itemized' && item.gradingService ? item.gradingService : ''
  );
  const [notes, setNotes] = useState(item.notes || '');
  const [bookValueType, setBookValueType] = useState<BookValueType>(item.bookValueType);
  const [customBookValue, setCustomBookValue] = useState(
    item.customBookValue?.toString() || ''
  );
  const [purchaseDate, setPurchaseDate] = useState(
    item.purchaseDate ? item.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setTitle(item.type === 'itemized' ? item.title : '');
      setMetal(item.metal);
      setQuantity('quantity' in item ? item.quantity : 1);
      setWeightOz(item.weightOz);
      setGrade(item.type === 'itemized' && item.grade ? item.grade : '');
      setGradingService(item.type === 'itemized' && item.gradingService ? item.gradingService : '');
      setNotes(item.notes || '');
      setBookValueType(item.bookValueType);
      setCustomBookValue(item.customBookValue?.toString() || '');
      setPurchaseDate(item.purchaseDate ? item.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    }
  }, [item]);

  const currentSpotPrice = prices?.[metal]?.pricePerOz || 0;
  const spotValue = weightOz * quantity * currentSpotPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      metal,
      weightOz,
      bookValueType,
      customBookValue: bookValueType === 'custom' ? parseFloat(customBookValue) : undefined,
      purchaseDate,
      ...(item.type === 'itemized' && {
        title,
        quantity,
        grade: grade || undefined,
        gradingService: gradingService || undefined,
      }),
      notes: notes || undefined,
    };

    try {
      await updateItem.mutateAsync({ id: item.id, data });
      onClose();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Item">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Title (Itemized only) */}
        {item.type === 'itemized' && (
          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 2021 Silver Eagle MS70"
            required
          />
        )}

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
          {item.type === 'itemized' && (
            <Input
              label="Quantity *"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          )}
        </div>

        {/* Grade and Service (Itemized only) */}
        {item.type === 'itemized' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g., MS70"
            />
            <Input
              label="Grading Service"
              value={gradingService}
              onChange={(e) => setGradingService(e.target.value)}
              placeholder="e.g., PCGS, NGC"
            />
          </div>
        )}

        {/* Book Value */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Book Value *
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="spot"
                checked={bookValueType === 'spot'}
                onChange={() => setBookValueType('spot')}
                className="text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-text-primary">
                Use Spot Value{' '}
                <span className="font-mono text-sm">({formatCurrency(spotValue)})</span>
              </span>
            </label>
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

        {/* Purchase Date */}
        <Input
          label="Purchase Date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />

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

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateItem.isPending || !currentSpotPrice}
            className="flex-1"
          >
            {updateItem.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
