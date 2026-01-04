'use client';

interface ProblemBadgeProps {
  problemType: string;
}

export function ProblemBadge({ problemType }: ProblemBadgeProps) {
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: '600',
      color: '#E53935',
      background: '#E5393515',
      padding: '2px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
    }}>
      {problemType}
    </span>
  );
}
