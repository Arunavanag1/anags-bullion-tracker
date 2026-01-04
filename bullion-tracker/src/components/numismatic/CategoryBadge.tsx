'use client';

interface CategoryBadgeProps {
  category: 'BULLION' | 'NUMISMATIC';
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const styles = {
    BULLION: {
      background: '#D4AF3715',
      color: '#D4AF37',
    },
    NUMISMATIC: {
      background: '#3B82F615',
      color: '#3B82F6',
    },
  };

  // Default to BULLION if category is not set
  const normalizedCategory = category || 'BULLION';
  const style = styles[normalizedCategory];

  return (
    <div style={{
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      background: style.background,
      color: style.color,
    }}>
      {normalizedCategory}
    </div>
  );
}
