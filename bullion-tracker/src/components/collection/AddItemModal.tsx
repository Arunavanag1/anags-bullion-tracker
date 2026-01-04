'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ImageUploader } from './ImageUploader';
import { useAddItem } from '@/hooks/useCollection';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import type { Metal, BookValueType } from '@/types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormType = 'itemized' | 'bulk';

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const [formType, setFormType] = useState<FormType>('itemized');
  const addItem = useAddItem();
  const { data: prices } = useSpotPrices();

  // Form state
  const [title, setTitle] = useState('');
  const [metal, setMetal] = useState<Metal>('silver');
  const [quantity, setQuantity] = useState(1);
  const [weightOz, setWeightOz] = useState(1);
  const [grade, setGrade] = useState('');
  const [gradingService, setGradingService] = useState('');
  const [notes, setNotes] = useState('');
  const [bookValueType, setBookValueType] = useState<BookValueType>('spot');
  const [customBookValue, setCustomBookValue] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const currentSpotPrice = prices?.[metal]?.pricePerOz || 0;
  const spotValue = weightOz * quantity * currentSpotPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      type: formType,
      metal,
      weightOz,
      bookValueType,
      spotPriceAtCreation: currentSpotPrice,
      customBookValue: bookValueType === 'custom' ? parseFloat(customBookValue) : undefined,
      purchaseDate,
      ...(formType === 'itemized' && {
        title,
        quantity,
        grade: grade || undefined,
        gradingService: gradingService || undefined,
      }),
      notes: notes || undefined,
      images,
    };

    try {
      await addItem.mutateAsync(data);
      onClose();
      // Reset form
      setTitle('');
      setQuantity(1);
      setWeightOz(1);
      setGrade('');
      setGradingService('');
      setNotes('');
      setBookValueType('spot');
      setCustomBookValue('');
      setImages([]);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1a1a1a",
            margin: 0,
          }}>
            Add to Collection
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Form Type Toggle */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              display: "flex",
              background: "#F5F5F5",
              borderRadius: "10px",
              padding: "4px",
            }}>
              <button
                type="button"
                onClick={() => setFormType('itemized')}
                style={{
                  flex: 1,
                  background: formType === 'itemized' ? "white" : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: formType === 'itemized' ? "#1a1a1a" : "#888",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: formType === 'itemized' ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Add Coin/Bullion
              </button>
              <button
                type="button"
                onClick={() => setFormType('bulk')}
                style={{
                  flex: 1,
                  background: formType === 'bulk' ? "white" : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: formType === 'bulk' ? "#1a1a1a" : "#888",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: formType === 'bulk' ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Add by Weight
              </button>
            </div>
          </div>

          {/* Metal Selection */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "12px",
            }}>
              Metal *
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(['gold', 'silver', 'platinum'] as Metal[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetal(m)}
                  style={{
                    flex: 1,
                    background: metal === m ? "#F0F0F0" : "white",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: metal === m ? "#1a1a1a" : "#666",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Title (Itemized only) */}
          {formType === 'itemized' && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
                marginBottom: "8px",
              }}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 2021 Silver Eagle MS70"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#1a1a1a",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Weight and Quantity */}
          <div style={{ display: "grid", gridTemplateColumns: formType === 'itemized' ? "1fr 1fr" : "1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
                marginBottom: "8px",
              }}>
                Weight (oz) *
              </label>
              <input
                type="number"
                step="0.001"
                value={weightOz}
                onChange={(e) => setWeightOz(parseFloat(e.target.value) || 0)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  color: "#1a1a1a",
                  outline: "none",
                }}
              />
            </div>
            {formType === 'itemized' && (
              <div>
                <label style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "8px",
                }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    color: "#1a1a1a",
                    outline: "none",
                  }}
                />
              </div>
            )}
          </div>

          {/* Grade and Service (Itemized only) */}
          {formType === 'itemized' && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "8px",
                }}>
                  Grade
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., MS70"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "8px",
                }}>
                  Grading Service
                </label>
                <input
                  type="text"
                  value={gradingService}
                  onChange={(e) => setGradingService(e.target.value)}
                  placeholder="e.g., PCGS, NGC"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* Book Value */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "12px",
            }}>
              Book Value *
            </label>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "8px" }}>
                <input
                  type="radio"
                  value="spot"
                  checked={bookValueType === 'spot'}
                  onChange={() => setBookValueType('spot')}
                  style={{ accentColor: "#D4AF37" }}
                />
                <span style={{ fontSize: "14px", color: "#1a1a1a" }}>
                  Use Spot Value{' '}
                  <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#666" }}>
                    (${spotValue.toFixed(2)})
                  </span>
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  value="custom"
                  checked={bookValueType === 'custom'}
                  onChange={() => setBookValueType('custom')}
                  style={{ accentColor: "#D4AF37" }}
                />
                <span style={{ fontSize: "14px", color: "#1a1a1a" }}>Custom Value</span>
              </label>
            </div>
            {bookValueType === 'custom' && (
              <input
                type="number"
                step="0.01"
                value={customBookValue}
                onChange={(e) => setCustomBookValue(e.target.value)}
                placeholder="Enter custom book value"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  color: "#1a1a1a",
                  outline: "none",
                }}
              />
            )}
          </div>

          {/* Purchase Date */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "8px",
            }}>
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E0E0E0",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#1a1a1a",
                outline: "none",
              }}
            />
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: "20px" }}>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "8px",
            }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E0E0E0",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#1a1a1a",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Submit Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: "white",
                color: "#1a1a1a",
                border: "1px solid #E0E0E0",
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addItem.isPending || !currentSpotPrice}
              style={{
                flex: 1,
                background: "#1a1a1a",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: addItem.isPending ? "not-allowed" : "pointer",
                opacity: addItem.isPending ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {addItem.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
