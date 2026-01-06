import React, { useState } from 'react';

// Coin Tracker Mockup - Matches existing Bullion Tracker dashboard design
const CoinTrackerMockup = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [valuationMode, setValuationMode] = useState('spot');
  const [timeRange, setTimeRange] = useState('1M');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [breakdownView, setBreakdownView] = useState(null); // null, 'bullion', or 'numismatic'
  
  // Add item flow state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [itemCategory, setItemCategory] = useState(null);
  const [gradingService, setGradingService] = useState(null);
  const [isProblemCoin, setIsProblemCoin] = useState(false);
  const [selectedCoinIndex, setSelectedCoinIndex] = useState(1);

  const resetAddFlow = () => {
    setAddStep(1);
    setItemCategory(null);
    setGradingService(null);
    setIsProblemCoin(false);
    setIsAddModalOpen(false);
  };

  // Mock data
  const portfolioItems = [
    { id: 1, category: 'NUMISMATIC', name: '1986 Silver Eagle MS68', service: 'PCGS', cert: '38472619', value: 75, confidence: 'high', metal: 'Silver', series: 'Silver Eagles' },
    { id: 2, category: 'BULLION', name: '10 oz Silver Bar - APMEX', qty: 2, value: 612, method: 'melt', metal: 'Silver' },
    { id: 3, category: 'NUMISMATIC', name: '1921-D Morgan Dollar ~AU58', service: 'RAW', value: 45, confidence: 'medium', estimated: true, metal: 'Silver', series: 'Morgan Dollars' },
    { id: 4, category: 'NUMISMATIC', name: '1889-CC Morgan Dollar ~VF30', service: 'RAW', value: 850, confidence: 'user', problem: 'cleaned', metal: 'Silver', series: 'Morgan Dollars' },
    { id: 5, category: 'BULLION', name: '2024 Proof Silver Eagle', qty: 1, value: 85, method: 'custom', metal: 'Silver' },
    { id: 6, category: 'NUMISMATIC', name: '1909-S VDB Lincoln Cent MS64', service: 'PCGS', cert: '29384756', value: 1250, confidence: 'high', metal: 'Copper', series: 'Lincoln Cents' },
    { id: 7, category: 'BULLION', name: '1 oz Gold Eagle', qty: 1, value: 2650, method: 'melt', metal: 'Gold' },
    { id: 8, category: 'NUMISMATIC', name: '1879-S Morgan Dollar MS65', service: 'NGC', cert: '5839201', value: 425, confidence: 'high', metal: 'Silver', series: 'Morgan Dollars' },
  ];

  const coinSearchResults = [
    { pcgs: 7296, name: '1921 $1 Morgan Dollar', mint: 'Philadelphia' },
    { pcgs: 7297, name: '1921-D $1 Morgan Dollar', mint: 'Denver' },
    { pcgs: 7298, name: '1921-S $1 Morgan Dollar', mint: 'San Francisco' },
  ];

  // Calculations
  const totalValue = portfolioItems.reduce((sum, item) => sum + item.value * (item.qty || 1), 0);
  const bullionValue = portfolioItems.filter(i => i.category === 'BULLION').reduce((s, i) => s + i.value * (i.qty || 1), 0);
  const numismaticValue = portfolioItems.filter(i => i.category === 'NUMISMATIC').reduce((s, i) => s + i.value * (i.qty || 1), 0);
  
  const bullionItems = portfolioItems.filter(i => i.category === 'BULLION');
  const numismaticItems = portfolioItems.filter(i => i.category === 'NUMISMATIC');
  
  // Bullion breakdown by metal
  const bullionByMetal = bullionItems.reduce((acc, item) => {
    const metal = item.metal;
    if (!acc[metal]) acc[metal] = { value: 0, count: 0 };
    acc[metal].value += item.value * (item.qty || 1);
    acc[metal].count += item.qty || 1;
    return acc;
  }, {});

  // Numismatic breakdown by series (top 2 + others)
  const numismaticBySeries = numismaticItems.reduce((acc, item) => {
    const series = item.series;
    if (!acc[series]) acc[series] = { value: 0, count: 0 };
    acc[series].value += item.value * (item.qty || 1);
    acc[series].count += 1;
    return acc;
  }, {});
  
  const sortedSeries = Object.entries(numismaticBySeries).sort((a, b) => b[1].value - a[1].value);
  const topSeries = sortedSeries.slice(0, 2);
  const othersSeries = sortedSeries.slice(2);
  const othersValue = othersSeries.reduce((sum, [_, data]) => sum + data.value, 0);
  const othersCount = othersSeries.reduce((sum, [_, data]) => sum + data.count, 0);

  const filteredItems = collectionFilter === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(i => i.category === collectionFilter);

  // Styles matching dashboard
  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#F8F7F4',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    container: {
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '32px 24px',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    label: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    goldAccent: '#D4AF37',
    green: '#22A06B',
    red: '#E53935',
    blue: '#3B82F6',
  };

  // Components
  const ConfidenceIndicator = ({ level }) => {
    const levels = { high: 4, medium: 2, low: 1, user: 0 };
    const count = levels[level] || 0;
    const labels = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence', user: 'User defined' };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: i < count ? styles.green : '#E0E0E0',
          }} />
        ))}
        <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>
          {labels[level]}
        </span>
      </div>
    );
  };

  const TabButton = ({ label, active, onClick, badge }) => (
    <button
      onClick={onClick}
      style={{
        background: active ? '#F0F0F0' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        color: active ? '#1a1a1a' : '#888',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {label}
      {badge && (
        <span style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          background: styles.goldAccent,
          color: 'white',
          fontSize: '9px',
          fontWeight: '600',
          padding: '1px 5px',
          borderRadius: '8px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );

  const ToggleButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: active ? 'white' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '500',
        color: active ? '#1a1a1a' : '#888',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {label}
    </button>
  );

  const TimeRangeButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: active ? '#1a1a1a' : 'transparent',
        border: active ? 'none' : '1px solid #E0E0E0',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '500',
        color: active ? 'white' : '#666',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  const ActionButton = ({ label, primary, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: primary ? '#1a1a1a' : 'white',
        color: primary ? 'white' : '#1a1a1a',
        border: primary ? 'none' : '1px solid #E0E0E0',
        borderRadius: '12px',
        padding: '14px 28px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  const MetricItem = ({ label, value, positive }) => (
    <div>
      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '16px',
        fontFamily: 'monospace',
        fontWeight: '500',
        color: positive !== undefined ? (positive ? styles.green : styles.red) : '#1a1a1a',
      }}>
        {value}
      </div>
    </div>
  );

  // Spot Price Banner
  const SpotPriceBanner = () => (
    <div style={{
      background: '#1a1a1a',
      padding: '12px 48px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '40px',
    }}>
      <PricePill metal="Au" price={2650.00} change={12.50} changePercent={0.47} color="#D4AF37" />
      <span style={{ color: '#444', fontSize: '8px' }}>•</span>
      <PricePill metal="Ag" price={30.62} change={0.28} changePercent={0.92} color="#A8A8A8" />
      <span style={{ color: '#444', fontSize: '8px' }}>•</span>
      <PricePill metal="Pt" price={1012.00} change={-5.20} changePercent={-0.51} color="#E5E4E2" />
      <span style={{ fontSize: '11px', color: '#555', marginLeft: '20px' }}>
        Updated 2:34 PM
      </span>
    </div>
  );

  const PricePill = ({ metal, price, change, changePercent, color }) => {
    const isPositive = change >= 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color }}>{metal}</span>
          <span style={{ fontSize: '14px', fontFamily: 'monospace', color: 'white' }}>
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '10px', color: '#666' }}>/oz</span>
        </div>
        {changePercent !== 0 && (
          <span style={{ fontSize: '10px', color: isPositive ? '#22A06B' : '#E53935', fontWeight: '600' }}>
            {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
          </span>
        )}
      </div>
    );
  };

  // Add Item Modal
  const AddItemModal = () => {
    if (!isAddModalOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}>
          {/* Close button */}
          <button
            onClick={resetAddFlow}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>

          <div style={{ padding: '28px' }}>
            {/* Progress indicator */}
            {addStep > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                {[1, 2, 3, 4].map(step => (
                  <React.Fragment key={step}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: step <= addStep ? '#1a1a1a' : '#E0E0E0',
                      color: step <= addStep ? 'white' : '#888',
                    }}>
                      {step < addStep ? '✓' : step}
                    </div>
                    {step < 4 && (
                      <div style={{ flex: 1, height: '2px', background: step < addStep ? '#1a1a1a' : '#E0E0E0' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Step 1: Category Selection */}
            {addStep === 1 && (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Add to Collection
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  What type of item are you adding?
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button
                    onClick={() => { setItemCategory('BULLION'); setAddStep(2); }}
                    style={{
                      padding: '24px',
                      background: '#FAFAFA',
                      border: '2px solid #E0E0E0',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.goldAccent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E0E0E0'}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🪙</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>Bullion</div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>Value based on metal content</div>
                    <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.6' }}>
                      • Bars & Rounds<br />• Generic coins<br />• Junk silver
                    </div>
                  </button>

                  <button
                    onClick={() => { setItemCategory('NUMISMATIC'); setAddStep(2); }}
                    style={{
                      padding: '24px',
                      background: '#FAFAFA',
                      border: '2px solid #E0E0E0',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.blue}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E0E0E0'}
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

            {/* Step 2: Bullion Entry */}
            {addStep === 2 && itemCategory === 'BULLION' && (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Add Bullion
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  Enter the details of your bullion piece
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Metal Type</label>
                    <select style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      background: 'white',
                    }}>
                      <option>Silver</option>
                      <option>Gold</option>
                      <option>Platinum</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Weight (oz)</label>
                      <input type="number" placeholder="1.0" style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #E0E0E0',
                        borderRadius: '10px',
                        boxSizing: 'border-box',
                      }} />
                    </div>
                    <div>
                      <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Quantity</label>
                      <input type="number" placeholder="1" style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #E0E0E0',
                        borderRadius: '10px',
                        boxSizing: 'border-box',
                      }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Description</label>
                    <input type="text" placeholder="e.g., APMEX 10 oz Silver Bar" style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setAddStep(1)} style={{
                    flex: 1,
                    padding: '14px',
                    background: 'white',
                    color: '#1a1a1a',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    ← Back
                  </button>
                  <button onClick={resetAddFlow} style={{
                    flex: 2,
                    padding: '14px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    Add to Collection
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Numismatic - Grading Service Selection */}
            {addStep === 2 && itemCategory === 'NUMISMATIC' && (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Grading Service
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  How is this coin graded?
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  {['PCGS', 'NGC', 'RAW'].map(service => (
                    <button
                      key={service}
                      onClick={() => { setGradingService(service); setAddStep(3); }}
                      style={{
                        padding: '20px',
                        background: '#FAFAFA',
                        border: '2px solid #E0E0E0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.blue}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E0E0E0'}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>{service}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{service === 'RAW' ? 'Ungraded' : 'Certified'}</div>
                    </button>
                  ))}
                </div>

                <button onClick={() => setAddStep(1)} style={{
                  width: '100%',
                  padding: '14px',
                  background: 'white',
                  color: '#1a1a1a',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}>
                  ← Back
                </button>
              </>
            )}

            {/* Step 3: Graded Coin - Cert Lookup */}
            {addStep === 3 && itemCategory === 'NUMISMATIC' && gradingService !== 'RAW' && (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  {gradingService} Cert Lookup
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  Enter certificate number to auto-populate coin details
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <input type="text" defaultValue="38472619" style={{
                    flex: 1,
                    padding: '14px 16px',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                  }} />
                  <button style={{
                    padding: '14px 24px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    Look Up
                  </button>
                </div>

                {/* Result */}
                <div style={{
                  padding: '20px',
                  background: `${styles.green}08`,
                  border: `1px solid ${styles.green}30`,
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ color: styles.green, fontSize: '18px' }}>✓</span>
                    <span style={{ color: styles.green, fontWeight: '600' }}>Coin Found</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                    1986 $1 Silver Eagle
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: `${styles.blue}15`,
                      color: styles.blue,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>MS68</span>
                    <span style={{ fontSize: '13px', color: '#888' }}>PCGS# 9801</span>
                  </div>
                </div>

                {/* Valuation */}
                <div style={{
                  padding: '20px',
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}>
                  <span style={{ ...styles.label, display: 'block', marginBottom: '16px' }}>Valuation</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Price Guide</div>
                      <div style={{ fontSize: '18px', fontFamily: 'monospace', color: '#1a1a1a' }}>$85</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Recent Sales</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#666' }}>$72, $78, $75</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>Suggested Value</span>
                      <span style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: '600', color: '#1a1a1a' }}>$75</span>
                    </div>
                    <ConfidenceIndicator level="high" />
                  </div>
                </div>

                {/* Value Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    border: `2px solid ${styles.goldAccent}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: `${styles.goldAccent}08`,
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${styles.goldAccent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: styles.goldAccent }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Use suggested value ($75)</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #CCC' }} />
                    <span style={{ fontSize: '14px', color: '#666' }}>Enter custom value</span>
                    <input type="text" placeholder="$" style={{
                      marginLeft: 'auto',
                      width: '100px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      border: '1px solid #E0E0E0',
                      borderRadius: '6px',
                      textAlign: 'right',
                    }} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setAddStep(2)} style={{
                    flex: 1,
                    padding: '14px',
                    background: 'white',
                    color: '#1a1a1a',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    ← Back
                  </button>
                  <button onClick={resetAddFlow} style={{
                    flex: 2,
                    padding: '14px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    Add to Collection
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Raw Coin Entry */}
            {addStep === 3 && itemCategory === 'NUMISMATIC' && gradingService === 'RAW' && (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Add Raw Coin
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  Search for coin type and estimate grade
                </p>

                {/* Search */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Search Coin</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
                    <input type="text" defaultValue="1921 morgan dollar" style={{
                      width: '100%',
                      padding: '14px 16px 14px 40px',
                      fontSize: '14px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                    }} />
                  </div>
                </div>

                {/* Search Results */}
                <div style={{ border: '1px solid #E0E0E0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                  {coinSearchResults.map((coin, i) => (
                    <button
                      key={coin.pcgs}
                      onClick={() => setSelectedCoinIndex(i)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: selectedCoinIndex === i ? '#F0F7FF' : 'white',
                        border: 'none',
                        borderBottom: i !== coinSearchResults.length - 1 ? '1px solid #F0F0F0' : 'none',
                        borderLeft: selectedCoinIndex === i ? `3px solid ${styles.blue}` : '3px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{coin.name}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>PCGS# {coin.pcgs} · {coin.mint}</div>
                      </div>
                      {selectedCoinIndex === i && <span style={{ color: styles.blue }}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Grade Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Estimated Grade</label>
                  <select style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    background: 'white',
                  }}>
                    <optgroup label="About Uncirculated">
                      <option>AU58 - About Uncirculated</option>
                      <option>AU55 - Choice About Uncirculated</option>
                      <option>AU53 - About Uncirculated</option>
                      <option>AU50 - About Uncirculated</option>
                    </optgroup>
                    <optgroup label="Extremely Fine">
                      <option>EF45 - Choice Extremely Fine</option>
                      <option>EF40 - Extremely Fine</option>
                    </optgroup>
                    <optgroup label="Very Fine">
                      <option>VF35 - Choice Very Fine</option>
                      <option>VF30 - Choice Very Fine</option>
                    </optgroup>
                  </select>
                </div>

                {/* Problem Coin Toggle */}
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
                    background: isProblemCoin ? styles.goldAccent : 'white',
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

                {isProblemCoin && (
                  <div style={{
                    padding: '16px',
                    background: `${styles.goldAccent}08`,
                    border: `1px solid ${styles.goldAccent}30`,
                    borderRadius: '10px',
                    marginBottom: '20px',
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Problem Type</label>
                      <select style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        background: 'white',
                      }}>
                        <option>Cleaned</option>
                        <option>Environmental Damage</option>
                        <option>Damaged</option>
                        <option>Questionable Toning</option>
                      </select>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#666',
                    }}>
                      <span style={{ color: styles.goldAccent }}>⚠️</span>
                      <span><strong style={{ color: '#1a1a1a' }}>Valuation Note:</strong> Problem coins are difficult to value. We'll apply a 50% discount, or enter a custom value.</span>
                    </div>
                  </div>
                )}

                {/* Valuation */}
                <div style={{
                  padding: '20px',
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}>
                  <span style={{ ...styles.label, display: 'block', marginBottom: '16px' }}>Estimated Valuation</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Value Range</span>
                    <span style={{ fontSize: '18px', fontFamily: 'monospace', color: '#1a1a1a' }}>$38 - $52</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #E0E0E0' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Mid Estimate</span>
                    <span style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: '600', color: '#1a1a1a' }}>$45</span>
                  </div>
                  <div style={{ paddingTop: '12px' }}>
                    <ConfidenceIndicator level="medium" />
                    <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>Grade is estimated · Raw discount applied</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setAddStep(2)} style={{
                    flex: 1,
                    padding: '14px',
                    background: 'white',
                    color: '#1a1a1a',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    ← Back
                  </button>
                  <button onClick={resetAddFlow} style={{
                    flex: 2,
                    padding: '14px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    Add to Collection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main Layout
  return (
    <div style={styles.page}>
      <SpotPriceBanner />

      <div style={styles.container}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
        }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
              Bullion Collection Tracker
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: '6px 0 0 0' }}>
              {portfolioItems.length} pieces · Bullion & Numismatic
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabButton label="Collection" active={activeTab === 'collection'} onClick={() => setActiveTab('collection')} badge={String(portfolioItems.length)} />
            <TabButton label="Collage" active={activeTab === 'collage'} onClick={() => setActiveTab('collage')} />
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
              {/* Portfolio Value Card */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={styles.label}>Portfolio Value</span>
                  <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: '10px', padding: '4px' }}>
                    <ToggleButton label="Spot" active={valuationMode === 'spot'} onClick={() => setValuationMode('spot')} />
                    <ToggleButton label="Book" active={valuationMode === 'book'} onClick={() => setValuationMode('book')} />
                  </div>
                </div>
                <div style={{ fontSize: '44px', fontFamily: 'monospace', fontWeight: '600', color: '#1a1a1a', marginBottom: '20px' }}>
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ display: 'flex', gap: '32px' }}>
                  <MetricItem label="Cost Basis" value={`$${(totalValue * 0.85).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                  <MetricItem label="Gain" value={`+$${(totalValue * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} positive={true} />
                  <MetricItem label="Return" value="+17.65%" positive={true} />
                </div>
              </div>

              {/* Category Breakdown Card */}
              <div style={styles.card}>
                <span style={{ ...styles.label, display: 'block', marginBottom: '20px' }}>
                  {breakdownView === 'bullion' ? 'Bullion by Metal' : breakdownView === 'numismatic' ? 'Numismatic by Type' : 'Category Breakdown'}
                </span>

                {breakdownView === null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={() => setBreakdownView('bullion')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #F5F5F5',
                        background: 'none',
                        border: 'none',
                        borderBottomWidth: '1px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: '#F5F5F5',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: styles.goldAccent, marginRight: '12px' }} />
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Bullion</span>
                      <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', marginRight: '16px' }}>
                        ${bullionValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#1a1a1a', marginRight: '12px' }}>
                        {Math.round((bullionValue / totalValue) * 100)}%
                      </span>
                      <span style={{ color: '#888' }}>→</span>
                    </button>

                    <button
                      onClick={() => setBreakdownView('numismatic')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: styles.blue, marginRight: '12px' }} />
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Numismatic</span>
                      <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', marginRight: '16px' }}>
                        ${numismaticValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#1a1a1a', marginRight: '12px' }}>
                        {Math.round((numismaticValue / totalValue) * 100)}%
                      </span>
                      <span style={{ color: '#888' }}>→</span>
                    </button>
                  </div>
                )}

                {breakdownView === 'bullion' && (
                  <>
                    <button
                      onClick={() => setBreakdownView(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '16px',
                      }}
                    >
                      ← Back to Categories
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(bullionByMetal).map(([metal, data]) => (
                        <div key={metal} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: metal === 'Gold' ? '#D4AF37' : metal === 'Silver' ? '#A8A8A8' : '#E5E4E2',
                            marginRight: '12px',
                          }} />
                          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{metal}</span>
                          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#666', marginRight: '16px' }}>{data.count} pcs</span>
                          <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a' }}>
                            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {breakdownView === 'numismatic' && (
                  <>
                    <button
                      onClick={() => setBreakdownView(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '16px',
                      }}
                    >
                      ← Back to Categories
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {topSeries.map(([series, data]) => (
                        <div key={series} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: styles.blue, marginRight: '12px' }} />
                          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{series}</span>
                          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#666', marginRight: '16px' }}>{data.count} pcs</span>
                          <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a' }}>
                            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      {othersCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CCC', marginRight: '12px' }} />
                          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#888' }}>Others</span>
                          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#666', marginRight: '16px' }}>{othersCount} pcs</span>
                          <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#888' }}>
                            ${othersValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Collection Items */}
            <div style={{ ...styles.card, marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={styles.label}>Collection Items</span>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  + Add Piece
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {portfolioItems.slice(0, 5).map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: '#FAFAFA',
                    borderRadius: '12px',
                    gap: '12px',
                  }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: item.category === 'BULLION' ? `${styles.goldAccent}15` : `${styles.blue}15`,
                      color: item.category === 'BULLION' ? styles.goldAccent : styles.blue,
                    }}>
                      {item.category}
                    </div>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</span>
                    {item.problem && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: styles.red,
                        background: `${styles.red}15`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}>
                        {item.problem}
                      </span>
                    )}
                    <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: '500', color: '#1a1a1a' }}>
                      ${(item.value * (item.qty || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {portfolioItems.length > 5 && (
                <button
                  onClick={() => setActiveTab('collection')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '12px',
                    background: 'none',
                    border: '1px solid #E0E0E0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#666',
                    cursor: 'pointer',
                  }}
                >
                  View All {portfolioItems.length} Items →
                </button>
              )}
            </div>

            {/* Value Over Time Chart */}
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={styles.label}>Value Over Time</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['24H', '1W', '1M', '1Y', '5Y'].map(range => (
                    <TimeRangeButton key={range} label={range} active={timeRange === range} onClick={() => setTimeRange(range)} />
                  ))}
                </div>
              </div>
              <div style={{ height: '180px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 1000 180" preserveAspectRatio="none">
                  {[0, 1, 2, 3].map(i => (
                    <line key={i} x1="0" y1={i * 60} x2="1000" y2={i * 60} stroke="#f0f0f0" strokeWidth="1" />
                  ))}
                  <path
                    d="M 0 140 L 100 130 L 200 145 L 300 120 L 400 100 L 500 90 L 600 95 L 700 70 L 800 60 L 900 50 L 1000 40"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#666', marginTop: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '20px', height: '3px', background: '#D4AF37', borderRadius: '2px' }} />
                    {valuationMode === 'spot' ? 'Melt Value' : 'Book Value'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', paddingTop: '28px' }}>
              <ActionButton label="Add Piece" primary onClick={() => setIsAddModalOpen(true)} />
              <ActionButton label="Export" onClick={() => {}} />
              <ActionButton label="View Collage" onClick={() => setActiveTab('collage')} />
            </div>
          </>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: '10px', padding: '4px' }}>
                <ToggleButton label="All" active={collectionFilter === 'all'} onClick={() => setCollectionFilter('all')} />
                <ToggleButton label="Bullion" active={collectionFilter === 'BULLION'} onClick={() => setCollectionFilter('BULLION')} />
                <ToggleButton label="Numismatic" active={collectionFilter === 'NUMISMATIC'} onClick={() => setCollectionFilter('NUMISMATIC')} />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                + Add Piece
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  gap: '16px',
                }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: item.category === 'BULLION' ? `${styles.goldAccent}15` : `${styles.blue}15`,
                    color: item.category === 'BULLION' ? styles.goldAccent : styles.blue,
                  }}>
                    {item.category}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.cert && <span style={{ fontSize: '12px', color: '#888' }}>Cert #{item.cert}</span>}
                      {item.qty && <span style={{ fontSize: '12px', color: '#888' }}>Qty: {item.qty}</span>}
                      {item.estimated && <span style={{ fontSize: '12px', color: styles.goldAccent, fontWeight: '500' }}>Grade estimated</span>}
                      {item.problem && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: styles.red,
                          background: `${styles.red}15`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}>
                          {item.problem}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ minWidth: '140px' }}>
                    {item.confidence ? <ConfidenceIndicator level={item.confidence} /> : (
                      <span style={{ fontSize: '11px', color: '#888' }}>{item.method === 'melt' ? 'Melt value' : 'Custom value'}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: '600', color: '#1a1a1a', minWidth: '100px', textAlign: 'right' }}>
                    ${(item.value * (item.qty || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collage Tab */}
        {activeTab === 'collage' && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>Photo Collage</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              View all your bullion and coin photos in a beautiful collage format
            </p>
            <ActionButton label="Open Photo Collage" primary onClick={() => {}} />
          </div>
        )}
      </div>

      <AddItemModal />
    </div>
  );
};

export default CoinTrackerMockup;
