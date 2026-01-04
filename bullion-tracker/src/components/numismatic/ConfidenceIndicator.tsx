'use client';

interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low' | 'user';
}

export function ConfidenceIndicator({ level }: ConfidenceIndicatorProps) {
  const levels = { high: 4, medium: 2, low: 1, user: 0 };
  const count = levels[level] || 0;
  const labels = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
    user: 'User defined'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: i < count ? '#22A06B' : '#E0E0E0',
        }} />
      ))}
      <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>
        {labels[level]}
      </span>
    </div>
  );
}
