'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Metal, CollectionItem, ItemizedPiece } from '@/types';

export interface CollectionPhotoCardProps {
  item: CollectionItem;
  imageUrl: string;
  isHovered?: boolean;
  className?: string;
}

const metalVariants: Record<Metal, 'gold' | 'silver' | 'platinum'> = {
  gold: 'gold',
  silver: 'silver',
  platinum: 'platinum',
};

export function CollectionPhotoCard({
  item,
  imageUrl,
  isHovered = false,
  className,
}: CollectionPhotoCardProps) {
  const isItemized = item.type === 'itemized';
  const title = isItemized
    ? (item as ItemizedPiece).title
    : `${item.metal.charAt(0).toUpperCase() + item.metal.slice(1)} (Bulk)`;
  const grade = item.grade;
  const weight = item.weightOz;

  return (
    <div
      className={cn(
        'relative w-[200px] h-[280px] rounded-2xl overflow-hidden bg-white shadow-lg transition-all duration-300',
        isHovered && 'scale-105 shadow-2xl z-10',
        className
      )}
    >
      {/* Image */}
      <div className="relative h-[180px] overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Metal badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={metalVariants[item.metal]} className="text-xs uppercase tracking-wide">
            {item.metal}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          {grade && (
            <span className="font-medium">{grade}</span>
          )}
          <span>{weight.toFixed(3)} oz</span>
        </div>
      </div>
    </div>
  );
}
