'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ImageUploader } from './ImageUploader';
import { useAddItem } from '@/hooks/useCollection';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { useCoinSearch } from '@/hooks/useCoinSearch';
import { useGrades } from '@/hooks/useGrades';
import { usePriceGuide } from '@/hooks/usePriceGuide';
import { ConfidenceIndicator } from '@/components/numismatic/ConfidenceIndicator';
import type { Metal, BookValueType } from '@/types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ItemCategory = 'BULLION' | 'NUMISMATIC';
type GradingService = 'PCGS' | 'NGC' | 'RAW';

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const addItem = useAddItem();
  const { data: prices } = useSpotPrices();

  // Multi-step state
  const [step, setStep] = useState(1);
  const [itemCategory, setItemCategory] = useState<ItemCategory | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);

  // Bullion state
  const [formType, setFormType] = useState<'itemized' | 'bulk'>('itemized');
  const [title, setTitle] = useState('');
  const [metal, setMetal] = useState<Metal>('silver');
  const [quantity, setQuantity] = useState(1);
  const [weightOz, setWeightOz] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookValueType, setBookValueType] = useState<BookValueType>('spot');
  const [customBookValue, setCustomBookValue] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');

  // Numismatic state
  const [certNumber, setCertNumber] = useState('');
  const [coinSearch, setCoinSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [isProblemCoin, setIsProblemCoin] = useState(false);
  const [problemType, setProblemType] = useState('cleaned');
  const [useCustomValue, setUseCustomValue] = useState(false);
  const [numismaticValue, setNumismaticValue] = useState('');

  const { data: coinResults } = useCoinSearch(coinSearch);
  const { data: grades } = useGrades();
  const { data: priceGuide, isLoading: isPriceGuideLoading } = usePriceGuide(selectedCoin?.id, grade);

  // Auto-populate numismatic value from price guide when coin and grade are selected
  useEffect(() => {
    if (itemCategory === 'NUMISMATIC' && !useCustomValue && priceGuide?.price) {
      setNumismaticValue(priceGuide.price.toString());
    }
  }, [itemCategory, priceGuide, useCustomValue, selectedCoin, grade]);

  const currentSpotPrice = prices?.[metal]?.pricePerOz || 0;
  const spotValue = weightOz * quantity * currentSpotPrice;

  const resetForm = () => {
    setStep(1);
    setItemCategory(null);
    setGradingService(null);
    setTitle('');
    setQuantity(1);
    setWeightOz(1);
    setNotes('');
    setBookValueType('spot');
    setCustomBookValue('');
    setImages([]);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchasePrice('');
    setCertNumber('');
    setCoinSearch('');
    setSelectedCoin(null);
    setGrade('');
    setIsProblemCoin(false);
    setProblemType('cleaned');
    setUseCustomValue(false);
    setNumismaticValue('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const baseData = {
      category: itemCategory,
      purchaseDate,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      notes: notes || undefined,
      images,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;
    if (itemCategory === 'BULLION') {
      data = {
        ...baseData,
        type: formType,
        metal,
        weightOz,
        quantity: formType === 'itemized' ? quantity : 1,
        title: formType === 'itemized' ? title : undefined,
        bookValueType,
        spotPriceAtCreation: currentSpotPrice,
        customBookValue: bookValueType === 'custom' ? parseFloat(customBookValue) : undefined,
      };
    } else {
      data = {
        ...baseData,
        metal,
        coinReferenceId: selectedCoin?.id,
        certNumber: gradingService !== 'RAW' ? certNumber : undefined,
        grade,
        gradingService,
        isProblemCoin,
        problemType: isProblemCoin ? problemType : undefined,
        isGradeEstimated: gradingService === 'RAW',
        bookValueType: useCustomValue ? 'custom' : 'numismatic',
        customBookValue: useCustomValue ? parseFloat(numismaticValue) : undefined,
        numismaticValue: !useCustomValue ? parseFloat(numismaticValue || '0') : undefined,
      };
    }

    try {
      await addItem.mutateAsync(data);
      handleClose();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Progress Indicator */}
        {step > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: s <= step ? '#1a1a1a' : '#E0E0E0',
                  color: s <= step ? 'white' : '#888',
                }}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div style={{ flex: 1, height: '2px', background: s < step ? '#1a1a1a' : '#E0E0E0', marginLeft: '8px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
              Add to Collection
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              What type of item are you adding?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                type="button"
                onClick={() => { setItemCategory('BULLION'); setStep(2); }}
                style={{
                  padding: '24px',
                  background: '#FAFAFA',
                  border: '2px solid #E0E0E0',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🪙</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>Bullion</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>Value based on metal content</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.6' }}>
                  • Bars & Rounds<br />• Generic coins<br />• Junk silver
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setItemCategory('NUMISMATIC'); setStep(2); }}
                style={{
                  padding: '24px',
                  background: '#FAFAFA',
                  border: '2px solid #E0E0E0',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏷️</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>Numismatic</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>Value based on rarity & grade</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.6' }}>
                  • Graded coins<br />• Raw coins<br />• Key dates
                </div>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '16px' }}>
              Use Numismatic for rare/proof bullion coins that carry a premium
            </p>
          </>
        )}

        {/* Step 2: Bullion Form */}
        {step === 2 && itemCategory === 'BULLION' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 24px 0' }}>
              Add Bullion
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Metal Type
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['gold', 'silver', 'platinum'] as Metal[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetal(m)}
                      style={{
                        flex: 1,
                        background: metal === m ? '#F0F0F0' : 'white',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: metal === m ? '#1a1a1a' : '#666',
                        cursor: 'pointer',
                      }}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Weight (oz)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={weightOz}
                    onChange={(e) => setWeightOz(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., APMEX 10 oz Silver Bar"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Valuation Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {(['spot', 'custom'] as BookValueType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBookValueType(type)}
                      style={{
                        background: bookValueType === type ? '#1a1a1a' : '#F5F5F5',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: bookValueType === type ? 'white' : '#666',
                        cursor: 'pointer',
                      }}
                    >
                      {type === 'spot' ? 'Spot Price' : 'Custom Value'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {bookValueType === 'custom' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Custom Value ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customBookValue}
                      onChange={(e) => setCustomBookValue(e.target.value)}
                      placeholder="Enter value"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #E0E0E0',
                        borderRadius: '10px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
                {bookValueType === 'spot' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Calculated Spot Value
                    </label>
                    <div style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      background: '#FAFAFA',
                      color: '#666',
                    }}>
                      ${spotValue.toFixed(2)}
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="What you paid"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Photos (Optional)
                </label>
                <ImageUploader images={images} onChange={setImages} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'white',
                  color: '#1a1a1a',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Add to Collection
              </button>
            </div>
          </>
        )}

        {/* Step 2: Grading Service Selection */}
        {step === 2 && itemCategory === 'NUMISMATIC' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
              Grading Service
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              How is this coin graded?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {(['PCGS', 'NGC', 'RAW'] as GradingService[]).map(service => (
                <button
                  key={service}
                  type="button"
                  onClick={() => { setGradingService(service); setStep(3); }}
                  style={{
                    padding: '20px',
                    background: '#FAFAFA',
                    border: '2px solid #E0E0E0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>{service}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{service === 'RAW' ? 'Ungraded' : 'Certified'}</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'white',
                color: '#1a1a1a',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </>
        )}

        {/* Step 3: Raw Coin Entry */}
        {step === 3 && itemCategory === 'NUMISMATIC' && gradingService === 'RAW' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 24px 0' }}>
              Add Raw Coin
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Metal Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['gold', 'silver', 'platinum', 'copper'] as Metal[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetal(m)}
                    style={{
                      flex: 1,
                      background: metal === m ? '#F0F0F0' : 'white',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: metal === m ? '#1a1a1a' : '#666',
                      cursor: 'pointer',
                    }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Search Coin
              </label>
              <input
                type="text"
                value={coinSearch}
                onChange={(e) => setCoinSearch(e.target.value)}
                placeholder="e.g., 1921 morgan"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {selectedCoin && (
              <div style={{
                padding: '14px 16px',
                background: '#F0F7FF',
                border: '1px solid #3B82F6',
                borderLeft: '3px solid #3B82F6',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{selectedCoin.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>PCGS# {selectedCoin.pcgsNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoin(null);
                    setCoinSearch('');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3B82F6',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#3B82F6',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3B82F6';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#3B82F6';
                  }}
                >
                  Change
                </button>
              </div>
            )}

            {coinResults && coinResults.length > 0 && !selectedCoin && (
              <div style={{
                border: '1px solid #E0E0E0',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '20px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {coinResults.map((coin, i) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => setSelectedCoin(coin)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'white',
                      border: 'none',
                      borderBottom: i !== coinResults.length - 1 ? '1px solid #F0F0F0' : 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{coin.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>PCGS# {coin.pcgsNumber}</div>
                  </button>
                ))}
              </div>
            )}

            {grades && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Estimated Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    background: 'white',
                  }}
                >
                  <option value="">Select grade...</option>
                  {Object.entries(grades).map(([category, gradeList]) => (
                    <optgroup key={category} label={category}>
                      {gradeList.map(g => (
                        <option key={g.gradeCode} value={g.gradeCode}>{g.gradeCode}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '10px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
              onClick={() => setIsProblemCoin(!isProblemCoin)}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                border: isProblemCoin ? 'none' : '2px solid #CCC',
                background: isProblemCoin ? '#D4AF37' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
              }}>
                {isProblemCoin && '✓'}
              </div>
              <span style={{ fontSize: '14px', color: '#1a1a1a' }}>This coin has been cleaned or has problems</span>
            </label>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Valuation Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setUseCustomValue(false)}
                  style={{
                    background: !useCustomValue ? '#1a1a1a' : '#F5F5F5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: !useCustomValue ? 'white' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Estimate from Guide
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomValue(true)}
                  style={{
                    background: useCustomValue ? '#1a1a1a' : '#F5F5F5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: useCustomValue ? 'white' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Custom Value
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                {useCustomValue ? 'Custom Value ($)' : 'Estimated Value from Guide ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={numismaticValue}
                onChange={(e) => setNumismaticValue(e.target.value)}
                placeholder={isPriceGuideLoading ? "Loading from price guide..." : (useCustomValue ? "Enter custom value" : "Auto-filled from price guide")}
                disabled={!useCustomValue && isPriceGuideLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  background: (!useCustomValue && isPriceGuideLoading) ? '#F5F5F5' : 'white',
                }}
              />
              {!useCustomValue && priceGuide && priceGuide.price && (
                <div style={{ fontSize: '11px', color: '#22A06B', marginTop: '6px' }}>
                  ✓ Price loaded from PCGS guide (updated {new Date(priceGuide.priceDate).toLocaleDateString()})
                </div>
              )}
              {!useCustomValue && selectedCoin && grade && priceGuide && !priceGuide.price && (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                  No price guide data available for this coin/grade combination
                </div>
              )}
            </div>

            {isProblemCoin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Problem Type
                </label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    background: 'white',
                  }}
                >
                  <option value="cleaned">Cleaned</option>
                  <option value="environmental">Environmental Damage</option>
                  <option value="damaged">Damaged</option>
                  <option value="questionable_toning">Questionable Toning</option>
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Purchase Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="What you paid"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Photos (Optional)
              </label>
              <ImageUploader images={images} onChange={setImages} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'white',
                  color: '#1a1a1a',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCoin || !grade}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: !selectedCoin || !grade ? '#CCC' : '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !selectedCoin || !grade ? 'not-allowed' : 'pointer',
                }}
              >
                Add to Collection
              </button>
            </div>
          </>
        )}

        {/* Step 3: Graded Coin - Cert Lookup */}
        {step === 3 && itemCategory === 'NUMISMATIC' && gradingService !== 'RAW' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
              {gradingService} Cert Lookup
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              Enter certificate number (cert lookup feature coming soon - manual entry for now)
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Metal Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['gold', 'silver', 'platinum', 'copper'] as Metal[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetal(m)}
                    style={{
                      flex: 1,
                      background: metal === m ? '#F0F0F0' : 'white',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: metal === m ? '#1a1a1a' : '#666',
                      cursor: 'pointer',
                    }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Certificate Number
              </label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="Enter cert number"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Search Coin
              </label>
              <input
                type="text"
                value={coinSearch}
                onChange={(e) => setCoinSearch(e.target.value)}
                placeholder="Search for coin type"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {selectedCoin && (
              <div style={{
                padding: '14px 16px',
                background: '#F0F7FF',
                border: '1px solid #3B82F6',
                borderLeft: '3px solid #3B82F6',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{selectedCoin.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>PCGS# {selectedCoin.pcgsNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoin(null);
                    setCoinSearch('');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3B82F6',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#3B82F6',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3B82F6';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#3B82F6';
                  }}
                >
                  Change
                </button>
              </div>
            )}

            {coinResults && coinResults.length > 0 && !selectedCoin && (
              <div style={{
                border: '1px solid #E0E0E0',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '20px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {coinResults.map((coin, i) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => setSelectedCoin(coin)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'white',
                      border: 'none',
                      borderBottom: i !== coinResults.length - 1 ? '1px solid #F0F0F0' : 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{coin.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>PCGS# {coin.pcgsNumber}</div>
                  </button>
                ))}
              </div>
            )}

            {grades && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    background: 'white',
                  }}
                >
                  <option value="">Select grade...</option>
                  {Object.entries(grades).map(([category, gradeList]) => (
                    <optgroup key={category} label={category}>
                      {gradeList.map(g => (
                        <option key={g.gradeCode} value={g.gradeCode}>{g.gradeCode}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '16px', marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Valuation Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setUseCustomValue(false)}
                  style={{
                    background: !useCustomValue ? '#1a1a1a' : '#F5F5F5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: !useCustomValue ? 'white' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Estimate from Guide
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomValue(true)}
                  style={{
                    background: useCustomValue ? '#1a1a1a' : '#F5F5F5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: useCustomValue ? 'white' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Custom Value
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                {useCustomValue ? 'Custom Value ($)' : 'Estimated Value from Guide ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={numismaticValue}
                onChange={(e) => setNumismaticValue(e.target.value)}
                placeholder={isPriceGuideLoading ? "Loading from price guide..." : (useCustomValue ? "Enter custom value" : "Auto-filled from price guide")}
                disabled={!useCustomValue && isPriceGuideLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  background: (!useCustomValue && isPriceGuideLoading) ? '#F5F5F5' : 'white',
                }}
              />
              {!useCustomValue && priceGuide && priceGuide.price && (
                <div style={{ fontSize: '11px', color: '#22A06B', marginTop: '6px' }}>
                  ✓ Price loaded from PCGS guide (updated {new Date(priceGuide.priceDate).toLocaleDateString()})
                </div>
              )}
              {!useCustomValue && selectedCoin && grade && priceGuide && !priceGuide.price && (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                  No price guide data available for this coin/grade combination
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Purchase Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="What you paid"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Photos (Optional)
              </label>
              <ImageUploader images={images} onChange={setImages} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'white',
                  color: '#1a1a1a',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCoin || !grade}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: !selectedCoin || !grade ? '#CCC' : '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !selectedCoin || !grade ? 'not-allowed' : 'pointer',
                }}
              >
                Add to Collection
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
