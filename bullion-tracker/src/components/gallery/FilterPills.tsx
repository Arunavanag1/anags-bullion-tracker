'use client';

import type { Metal } from '@/types';

export type FilterOption = Metal | 'all';

export interface FilterPillsProps {
  activeFilters: Set<Metal>;
  onFilterChange: (filters: Set<Metal>) => void;
  itemCounts?: {
    gold: number;
    silver: number;
    platinum: number;
    all: number;
  };
}

const FILTER_OPTIONS: { value: FilterOption; label: string; color: string; activeColor: string }[] = [
  { value: 'all', label: 'All', color: '#E8E8E8', activeColor: '#1a1a1a' },
  { value: 'gold', label: 'Gold', color: '#FEF3C7', activeColor: '#D97706' },
  { value: 'silver', label: 'Silver', color: '#E2E8F0', activeColor: '#64748B' },
  { value: 'platinum', label: 'Platinum', color: '#F3F4F6', activeColor: '#6B7280' },
];

export function FilterPills({ activeFilters, onFilterChange, itemCounts }: FilterPillsProps) {
  const isAllActive = activeFilters.size === 0 || activeFilters.size === 3;

  const handleClick = (option: FilterOption) => {
    if (option === 'all') {
      // Clear all filters (show all)
      onFilterChange(new Set());
      return;
    }

    const newFilters = new Set(activeFilters);

    if (newFilters.has(option)) {
      newFilters.delete(option);
    } else {
      newFilters.add(option);
    }

    // If all three are selected, treat as "all"
    if (newFilters.size === 3) {
      onFilterChange(new Set());
    } else {
      onFilterChange(newFilters);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = option.value === 'all'
          ? isAllActive
          : activeFilters.has(option.value);

        const count = itemCounts?.[option.value];

        return (
          <button
            key={option.value}
            onClick={() => handleClick(option.value)}
            style={{
              background: isActive ? option.activeColor : option.color,
              color: isActive ? 'white' : '#333',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {option.label}
            {count !== undefined && (
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '500',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
