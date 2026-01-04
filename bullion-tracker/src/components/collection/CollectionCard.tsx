'use client';

import { useState } from 'react';
import { CollectionItem } from '@/types';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { useDeleteItem } from '@/hooks/useCollection';
import {
  formatCurrency,
  formatWeight,
  formatPercent,
  getMetalEmoji,
  getCalculatedValues,
} from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EditItemModal } from './EditItemModal';
import { CategoryBadge } from '@/components/numismatic/CategoryBadge';
import { ConfidenceIndicator } from '@/components/numismatic/ConfidenceIndicator';
import { ProblemBadge } from '@/components/numismatic/ProblemBadge';
import { cn } from '@/lib/utils';

interface CollectionCardProps {
  item: CollectionItem;
}

export function CollectionCard({ item }: CollectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: prices } = useSpotPrices();
  const deleteItem = useDeleteItem();

  if (!prices) return null;

  const currentPrice = prices[item.metal].pricePerOz;
  const { currentMeltValue, currentBookValue, percentChange } = getCalculatedValues(
    item,
    currentPrice
  );

  const quantity = 'quantity' in item ? item.quantity : 1;
  const totalWeight = (item.weightOz || 0) * quantity;
  const hasImage = item.images && item.images.length > 0;
  const displayTitle = item.category === 'NUMISMATIC'
    ? item.title || 'Numismatic Coin'
    : (item.type === 'itemized' && 'title' in item ? item.title : `${item.metal.toUpperCase()} (Bulk)`);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem.mutateAsync(item.id);
    }
  };

  return (
    <Card
      hover
      className={cn(
        'cursor-pointer transition-all duration-200',
        isExpanded && 'ring-2 ring-accent-primary'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Image */}
      {hasImage && (
        <div className="mb-4 -mx-6 -mt-6 h-48 relative rounded-t-xl overflow-hidden bg-background-secondary">
          <img
            src={item.images[0]}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title and Category Badge */}
      <div className="mb-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <CategoryBadge category={item.category as 'BULLION' | 'NUMISMATIC'} />
          {item.isProblemCoin && item.problemType && (
            <ProblemBadge problemType={item.problemType} />
          )}
        </div>
        <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
          {displayTitle}
        </h3>
        {item.category === 'NUMISMATIC' && (
          <div className="text-sm text-text-secondary mt-1">
            {item.gradingService && `${item.gradingService} `}
            {item.grade}
            {item.certNumber && ` • Cert #${item.certNumber}`}
          </div>
        )}
      </div>

      {/* Weight & Metal */}
      <div className="flex items-center gap-2 text-text-primary mb-4">
        <span className="text-xl">{getMetalEmoji(item.metal)}</span>
        <span className="font-mono text-sm">
          {item.weightOz} oz {quantity > 1 && `× ${quantity} = ${formatWeight(totalWeight)}`}
        </span>
      </div>

      {/* Values */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Melt:</span>
          <span className="font-mono font-medium text-text-primary">
            {formatCurrency(currentMeltValue)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Book:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-text-primary">
              {formatCurrency(currentBookValue)}
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                percentChange >= 0 ? 'text-success' : 'text-red-600'
              )}
            >
              {formatPercent(percentChange)}
            </span>
          </div>
        </div>
        {item.category === 'NUMISMATIC' && item.confidenceLevel && (
          <div style={{ paddingTop: '8px' }}>
            <ConfidenceIndicator level={item.confidenceLevel as 'high' | 'medium' | 'low' | 'user'} />
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className="mt-4 pt-4 border-t border-border space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {item.notes && (
            <div>
              <div className="text-xs text-text-secondary mb-1">Notes:</div>
              <div className="text-sm text-text-primary">{item.notes}</div>
            </div>
          )}

          <div className="text-xs text-text-secondary">
            Added: {new Date(item.createdAt).toLocaleDateString()}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDelete}
              disabled={deleteItem.isPending}
              className="flex-1"
            >
              {deleteItem.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
      />
    </Card>
  );
}
