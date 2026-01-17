'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { CollectionCard } from './CollectionCard';
import { calculateCurrentMeltValue, calculateCurrentBookValue } from '@/lib/calculations';
import type { Metal, CollectionItem } from '@/types';

type SortOption = 'date' | 'metal' | 'melt' | 'book' | 'weight';
type CategoryFilter = 'all' | 'BULLION' | 'NUMISMATIC';

interface CollectionGridProps {
  onAddItem: () => void;
}

export function CollectionGrid({ onAddItem }: CollectionGridProps) {
  const { data: items, isLoading: _isLoading, error: _error } = useCollection();
  const { data: prices } = useSpotPrices();
  const [filterMetal, setFilterMetal] = useState<Metal | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Filter and sort items
  const processedItems = useMemo(() => {
    if (!items || !prices) return [];

    // Filter by category
    let filtered = filterCategory === 'all'
      ? items
      : items.filter((item: CollectionItem) => item.category === filterCategory);

    // Filter by metal (only for bullion items or when category is 'all')
    if (filterMetal !== 'all') {
      filtered = filtered.filter((item: CollectionItem) => item.metal === filterMetal);
    }

    // Sort
    const sorted = [...filtered].sort((a: CollectionItem, b: CollectionItem) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        case 'metal':
          return a.metal.localeCompare(b.metal);

        case 'weight': {
          const aWeight = a.weightOz * (a.quantity ?? 1);
          const bWeight = b.weightOz * (b.quantity ?? 1);
          return bWeight - aWeight;
        }

        case 'melt': {
          const aPrice = prices[a.metal].pricePerOz;
          const bPrice = prices[b.metal].pricePerOz;
          const aMelt = calculateCurrentMeltValue(a, aPrice);
          const bMelt = calculateCurrentMeltValue(b, bPrice);
          return bMelt - aMelt;
        }

        case 'book': {
          const aPrice = prices[a.metal].pricePerOz;
          const bPrice = prices[b.metal].pricePerOz;
          const aBook = calculateCurrentBookValue(a, aPrice);
          const bBook = calculateCurrentBookValue(b, bPrice);
          return bBook - aBook;
        }

        default:
          return 0;
      }
    });

    return sorted;
  }, [items, prices, filterMetal, filterCategory, sortBy]);

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header with Add Piece button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#1a1a1a", margin: 0 }}>
          Collection
        </h2>
        <button
          onClick={onAddItem}
          style={{
            background: "#1a1a1a",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          + Add Piece
        </button>
      </div>

      {/* Header with filters */}
      <div style={{ marginBottom: "28px" }}>
        {/* Category Filter Section */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "block",
            marginBottom: "12px",
          }}>
            Filter by Category
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <FilterButton
              label="All"
              active={filterCategory === 'all'}
              onClick={() => setFilterCategory('all')}
            />
            <FilterButton
              label="Bullion"
              active={filterCategory === 'BULLION'}
              onClick={() => setFilterCategory('BULLION')}
            />
            <FilterButton
              label="Numismatic"
              active={filterCategory === 'NUMISMATIC'}
              onClick={() => setFilterCategory('NUMISMATIC')}
            />
          </div>
        </div>

        {/* Metal Filter Section */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "block",
            marginBottom: "12px",
          }}>
            Filter by Metal
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <FilterButton
              label="All"
              active={filterMetal === 'all'}
              onClick={() => setFilterMetal('all')}
            />
            <FilterButton
              label="Gold"
              active={filterMetal === 'gold'}
              onClick={() => setFilterMetal('gold')}
            />
            <FilterButton
              label="Silver"
              active={filterMetal === 'silver'}
              onClick={() => setFilterMetal('silver')}
            />
            <FilterButton
              label="Platinum"
              active={filterMetal === 'platinum'}
              onClick={() => setFilterMetal('platinum')}
            />
          </div>
        </div>

        {/* Sort Section */}
        <div>
          <span style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "block",
            marginBottom: "12px",
          }}>
            Sort By
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <SortButton
              label="Date Added"
              active={sortBy === 'date'}
              onClick={() => setSortBy('date')}
            />
            <SortButton
              label="Metal"
              active={sortBy === 'metal'}
              onClick={() => setSortBy('metal')}
            />
            <SortButton
              label="Weight"
              active={sortBy === 'weight'}
              onClick={() => setSortBy('weight')}
            />
            <SortButton
              label="Melt Value"
              active={sortBy === 'melt'}
              onClick={() => setSortBy('melt')}
            />
            <SortButton
              label="Book Value"
              active={sortBy === 'book'}
              onClick={() => setSortBy('book')}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {processedItems && processedItems.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}>
          {processedItems.map((item: CollectionItem) => (
            <CollectionCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "48px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "18px",
            color: "#666",
            marginBottom: "20px",
          }}>
            {filterMetal === 'all'
              ? 'No items in your collection yet'
              : `No ${filterMetal} items found`}
          </div>
          <button
            onClick={onAddItem}
            style={{
              background: "#1a1a1a",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Add Your First Item
          </button>
        </div>
      )}
    </div>
  );
}

// Filter Button Component
const FilterButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#F0F0F0" : "white",
      border: active ? "none" : "1px solid #E0E0E0",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "500",
      color: active ? "#1a1a1a" : "#666",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
  >
    {label}
  </button>
);

// Sort Button Component
const SortButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#1a1a1a" : "transparent",
      border: active ? "none" : "1px solid #E0E0E0",
      borderRadius: "6px",
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: "500",
      color: active ? "white" : "#666",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
  >
    {label}
  </button>
);
