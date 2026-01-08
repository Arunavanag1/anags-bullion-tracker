'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { CollectionItem, ItemizedPiece, Metal } from '@/types';
import { formatCurrency, formatWeight } from '@/lib/calculations';

export interface ItemLightboxProps {
  item: CollectionItem | null;
  onClose: () => void;
  spotPrices?: {
    gold: number;
    silver: number;
    platinum: number;
  };
}

const metalVariants: Record<Metal, 'gold' | 'silver' | 'platinum'> = {
  gold: 'gold',
  silver: 'silver',
  platinum: 'platinum',
};

export function ItemLightbox({ item, onClose, spotPrices }: ItemLightboxProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when item changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item?.id]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!item) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentImageIndex((prev) =>
            prev > 0 ? prev - 1 : item.images.length - 1
          );
          break;
        case 'ArrowRight':
          setCurrentImageIndex((prev) =>
            prev < item.images.length - 1 ? prev + 1 : 0
          );
          break;
      }
    },
    [item, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!item) return null;

  const isItemized = item.type === 'itemized';
  const title = isItemized
    ? (item as ItemizedPiece).title
    : `${item.metal.charAt(0).toUpperCase() + item.metal.slice(1)} (Bulk)`;
  const grade = item.grade;
  const gradingService = item.gradingService;
  const images = item.images || [];
  const hasMultipleImages = images.length > 1;

  // Calculate melt value
  const currentSpotPrice = spotPrices?.[item.metal] || 0;
  const meltValue = item.weightOz * currentSpotPrice;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4 flex flex-col md:flex-row gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white text-4xl transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        {/* Image section */}
        <div className="relative flex-1 flex flex-col items-center">
          {/* Main image */}
          <div className="relative w-full max-h-[60vh] md:max-h-[70vh] flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={`${title} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                No image
              </div>
            )}

            {/* Navigation arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev > 0 ? prev - 1 : images.length - 1
                    );
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev < images.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Image indicators */}
          {hasMultipleImages && (
            <div className="flex gap-2 mt-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex
                      ? 'bg-white'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Metadata panel */}
        <div className="md:w-72 bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
          {/* Metal badge */}
          <Badge
            variant={metalVariants[item.metal]}
            className="mb-4"
          >
            {item.metal.toUpperCase()}
          </Badge>

          {/* Title */}
          <h2 className="text-xl font-semibold mb-4">{title}</h2>

          {/* Details grid */}
          <div className="space-y-3 text-sm">
            {grade && (
              <div className="flex justify-between">
                <span className="text-white/60">Grade</span>
                <span className="font-medium">
                  {gradingService ? `${gradingService} ` : ''}{grade}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-white/60">Weight</span>
              <span className="font-medium">{formatWeight(item.weightOz)}</span>
            </div>

            {isItemized && (item as ItemizedPiece).quantity > 1 && (
              <div className="flex justify-between">
                <span className="text-white/60">Quantity</span>
                <span className="font-medium">{(item as ItemizedPiece).quantity}</span>
              </div>
            )}

            <div className="border-t border-white/20 my-3" />

            <div className="flex justify-between">
              <span className="text-white/60">Melt Value</span>
              <span className="font-medium">{formatCurrency(meltValue)}</span>
            </div>

            {item.category === 'NUMISMATIC' && item.numismaticValue && (
              <div className="flex justify-between">
                <span className="text-white/60">Numismatic Value</span>
                <span className="font-medium text-amber-400">
                  {formatCurrency(item.numismaticValue)}
                </span>
              </div>
            )}

            {item.notes && (
              <>
                <div className="border-t border-white/20 my-3" />
                <div>
                  <span className="text-white/60 block mb-1">Notes</span>
                  <p className="text-white/90 text-xs">{item.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
