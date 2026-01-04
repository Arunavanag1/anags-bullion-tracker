'use client';

import { useSpotPrices } from '@/hooks/useSpotPrices';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { cn } from '@/lib/utils';

export function SpotPriceTicker() {
  const { data: prices, isLoading, error } = useSpotPrices();

  if (isLoading) {
    return (
      <div className="bg-background-card border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-text-secondary">
            Loading spot prices...
          </div>
        </div>
      </div>
    );
  }

  if (error || !prices) {
    return (
      <div className="bg-background-card border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-text-secondary">
            Unable to load spot prices
          </div>
        </div>
      </div>
    );
  }

  const PriceItem = ({
    emoji,
    name,
    price,
    changePercent,
  }: {
    emoji: string;
    name: string;
    price: number;
    changePercent: number;
  }) => {
    const isPositive = changePercent >= 0;

    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold text-text-primary uppercase text-sm">
            {name}
          </span>
          <span className="font-mono text-lg font-bold text-text-primary">
            {formatCurrency(price)}
          </span>
          <span
            className={cn(
              'font-mono text-sm font-medium',
              isPositive ? 'text-success' : 'text-red-600'
            )}
          >
            {isPositive ? '▲' : '▼'} {formatPercent(Math.abs(changePercent))}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="sticky top-0 z-40 bg-background-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          <PriceItem
            emoji="🥇"
            name="Gold"
            price={prices.gold.pricePerOz}
            changePercent={prices.gold.changePercent24h}
          />
          <PriceItem
            emoji="🥈"
            name="Silver"
            price={prices.silver.pricePerOz}
            changePercent={prices.silver.changePercent24h}
          />
          <PriceItem
            emoji="🪙"
            name="Platinum"
            price={prices.platinum.pricePerOz}
            changePercent={prices.platinum.changePercent24h}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-text-secondary">
            Updated: {new Date(prices.gold.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
