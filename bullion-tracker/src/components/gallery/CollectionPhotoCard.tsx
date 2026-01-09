'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Metal, CollectionItem, ItemizedPiece } from '@/types';

export interface CollectionPhotoCardProps {
  item: CollectionItem;
  imageUrl: string;
  isHovered?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const metalVariants: Record<Metal, 'gold' | 'silver' | 'platinum'> = {
  gold: 'gold',
  silver: 'silver',
  platinum: 'platinum',
};

const sizeConfig = {
  sm: { card: 'w-[180px] h-[250px]', image: 'h-[160px]', padding: 'p-3', title: 'text-xs', badge: 'text-[10px]' },
  md: { card: 'w-[220px] h-[300px]', image: 'h-[200px]', padding: 'p-4', title: 'text-sm', badge: 'text-xs' },
  lg: { card: 'w-[260px] h-[350px]', image: 'h-[240px]', padding: 'p-4', title: 'text-base', badge: 'text-xs' },
};

export function CollectionPhotoCard({
  item,
  imageUrl,
  isHovered = false,
  className,
  size = 'lg',
}: CollectionPhotoCardProps) {
  // Check for title property directly - works for both itemized bullion and numismatic items
  const title = 'title' in item && item.title
    ? item.title
    : `${item.metal.charAt(0).toUpperCase() + item.metal.slice(1)} (Bulk)`;
  const grade = item.grade;
  const weight = item.weightOz;
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden bg-white shadow-lg transition-all duration-300',
        config.card,
        isHovered && 'scale-105 shadow-2xl z-10',
        className
      )}
    >
      {/* Image */}
      <div className={cn('relative overflow-hidden bg-gray-100 flex items-center justify-center', config.image)}>
        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
        {/* Metal badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={metalVariants[item.metal]} className={cn('uppercase tracking-wide', config.badge)}>
            {item.metal}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className={cn('space-y-1', config.padding)}>
        <h3 className={cn('font-semibold text-gray-900 line-clamp-2 leading-tight', config.title)}>
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
