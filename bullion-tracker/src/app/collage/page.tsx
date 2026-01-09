'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCollection } from '@/hooks/useCollection';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { AuthButton } from '@/components/auth/AuthButton';
import {
  RadialScrollGallery,
  CollectionPhotoCard,
  ItemLightbox,
  FilterPills,
} from '@/components/gallery';
import type { CollectionItem, Metal } from '@/types';

export default function CollagePage() {
  const { data: items, isLoading } = useCollection();
  const { data: spotPrices } = useSpotPrices();
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<Metal>>(new Set());

  // Get items with images
  const itemsWithImages = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (item: CollectionItem) => item.images && item.images.length > 0
    );
  }, [items]);

  // Calculate item counts per metal type
  const itemCounts = useMemo(() => {
    const counts = { gold: 0, silver: 0, platinum: 0, all: 0 };
    itemsWithImages.forEach((item: CollectionItem) => {
      const imageCount = item.images?.length || 0;
      counts[item.metal as Metal] += imageCount;
      counts.all += imageCount;
    });
    return counts;
  }, [itemsWithImages]);

  // Flatten to create gallery items (one per image), applying filter
  const galleryItems = useMemo(() => {
    const filtered = activeFilters.size === 0
      ? itemsWithImages
      : itemsWithImages.filter((item: CollectionItem) =>
          activeFilters.has(item.metal as Metal)
        );

    return filtered.flatMap((item: CollectionItem) =>
      (item.images || []).map((imageUrl: string, imageIndex: number) => ({
        item,
        imageUrl,
        imageIndex,
        key: `${item.id}-${imageIndex}`,
      }))
    );
  }, [itemsWithImages, activeFilters]);

  const handleItemSelect = (index: number) => {
    const galleryItem = galleryItems[index];
    if (galleryItem) {
      setSelectedItem(galleryItem.item);
    }
  };

  const spotPricesMap = spotPrices
    ? {
        gold: spotPrices.gold.pricePerOz,
        silver: spotPrices.silver.pricePerOz,
        platinum: spotPrices.platinum.pricePerOz,
      }
    : undefined;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F7F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div style={{ fontSize: '16px', color: '#666' }}>
          Loading collection...
        </div>
      </div>
    );
  }

  // Check if we have any photos at all (before filtering)
  const hasAnyPhotos = itemCounts.all > 0;
  const isFiltered = activeFilters.size > 0;

  // Empty state - no photos matching current filter OR no photos at all
  if (galleryItems.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F7F4',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'white',
            borderBottom: '1px solid #E0E0E0',
            padding: '32px 48px',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              {hasAnyPhotos && (
                <FilterPills
                  activeFilters={activeFilters}
                  onFilterChange={setActiveFilters}
                  itemCounts={itemCounts}
                />
              )}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      background: '#E8E8E8',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily:
                        "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                    }}
                  >
                    Back to Dashboard
                  </button>
                </Link>
                <AuthButton />
              </div>
            </div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1a1a1a',
                margin: 0,
                marginBottom: '8px',
              }}
            >
              Photo Gallery
            </h1>
            <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
              {isFiltered ? 'No photos match your filter' : 'Scroll through your collection'}
            </p>
          </div>
        </div>

        {/* Empty state content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 32px' }}>
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '64px 48px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                marginBottom: '24px',
                opacity: 0.5,
              }}
            >
              {isFiltered ? '🔍' : '📸'}
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#333',
                marginBottom: '12px',
                fontWeight: '600',
              }}
            >
              {isFiltered
                ? 'No photos match your filter'
                : 'No photos in your collection yet'}
            </div>
            <div
              style={{
                fontSize: '15px',
                color: '#666',
                marginBottom: '32px',
              }}
            >
              {isFiltered
                ? 'Try selecting different metal types or click "All" to see everything'
                : 'Add images to your bullion pieces to see them here'}
            </div>
            {isFiltered ? (
              <button
                onClick={() => setActiveFilters(new Set())}
                style={{
                  background: '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Show All Photos
              </button>
            ) : (
              <Link href="/" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Add Items with Images
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8F7F4',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Fixed Header */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'rgba(248, 247, 244, 0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '16px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1a1a1a',
                margin: 0,
              }}
            >
              Photo Gallery
            </h1>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              {galleryItems.length} photo{galleryItems.length !== 1 ? 's' : ''}{activeFilters.size > 0 ? ` · Filtered` : ''} · Scroll to explore
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <FilterPills
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              itemCounts={itemCounts}
            />
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: '#E8E8E8',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily:
                    "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                Dashboard
              </button>
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: '80px' }} />

      {/* Radial Gallery */}
      <RadialScrollGallery
        onItemSelect={handleItemSelect}
        baseRadius={450}
        mobileRadius={200}
        visiblePercentage={45}
        scrollDuration={galleryItems.length > 8 ? 3500 : 2500}
      >
        {(hoveredIndex: number | null) =>
          galleryItems.map((galleryItem: { item: CollectionItem; imageUrl: string; imageIndex: number; key: string }, index: number) => (
            <CollectionPhotoCard
              key={galleryItem.key}
              item={galleryItem.item}
              imageUrl={galleryItem.imageUrl}
              isHovered={hoveredIndex === index}
            />
          ))
        }
      </RadialScrollGallery>

      {/* Scroll hint at the bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: '500',
          pointerEvents: 'none',
          opacity: 0.9,
        }}
      >
        Scroll to rotate · Click to view details
      </div>

      {/* Lightbox */}
      <ItemLightbox
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        spotPrices={spotPricesMap}
      />
    </div>
  );
}
