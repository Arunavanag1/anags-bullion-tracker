'use client';

import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { useValuationBreakdown } from '@/hooks/useValuationBreakdown';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { formatCurrency, formatWeight, getMetalEmoji } from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { AllocationDonutChart } from '@/components/charts/AllocationDonutChart';

export function CollectionSummary() {
  const { data: summary, isLoading } = usePortfolioSummary();
  const { data: breakdown } = useValuationBreakdown();
  const { data: prices } = useSpotPrices();

  if (isLoading || !summary) {
    return (
      <Card>
        <div className="text-center text-text-secondary py-8">
          Loading summary...
        </div>
      </Card>
    );
  }

  const percentChange = summary.totalMeltValue > 0
    ? ((summary.totalBookValue - summary.totalMeltValue) / summary.totalMeltValue) * 100
    : 0;

  // Calculate allocation percentages based on melt value
  const goldValue = prices ? summary.goldOz * prices.gold.pricePerOz : 0;
  const silverValue = prices ? summary.silverOz * prices.silver.pricePerOz : 0;
  const platinumValue = prices ? summary.platinumOz * prices.platinum.pricePerOz : 0;
  const totalValue = goldValue + silverValue + platinumValue;

  const goldPercent = totalValue > 0 ? (goldValue / totalValue) * 100 : 0;
  const silverPercent = totalValue > 0 ? (silverValue / totalValue) * 100 : 0;
  const platinumPercent = totalValue > 0 ? (platinumValue / totalValue) * 100 : 0;

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metal Totals with Donut Chart */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Total Holdings
          </h3>

          {summary.totalItems > 0 && prices ? (
            <div className="flex gap-4">
              {/* Donut Chart */}
              <div className="flex-shrink-0">
                <AllocationDonutChart
                  goldOz={summary.goldOz}
                  silverOz={summary.silverOz}
                  platinumOz={summary.platinumOz}
                  goldPrice={prices.gold.pricePerOz}
                  silverPrice={prices.silver.pricePerOz}
                  platinumPrice={prices.platinum.pricePerOz}
                />
              </div>

              {/* Legend with percentages */}
              <div className="flex-1 space-y-2">
                {summary.goldOz > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D4AF37' }}></span>
                      <span className="text-sm text-text-primary">Gold</span>
                    </span>
                    <span className="font-mono text-sm text-text-primary font-semibold">
                      {goldPercent.toFixed(1)}%
                    </span>
                  </div>
                )}
                {summary.silverOz > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#71706E' }}></span>
                      <span className="text-sm text-text-primary">Silver</span>
                    </span>
                    <span className="font-mono text-sm text-text-primary font-semibold">
                      {silverPercent.toFixed(1)}%
                    </span>
                  </div>
                )}
                {summary.platinumOz > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8D9093' }}></span>
                      <span className="text-sm text-text-primary">Platinum</span>
                    </span>
                    <span className="font-mono text-sm text-text-primary font-semibold">
                      {platinumPercent.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-text-secondary text-sm">No items yet</div>
          )}
        </div>

        {/* Portfolio Value */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Portfolio Value
          </h3>
          <div className="text-3xl font-bold text-text-primary font-mono">
            {formatCurrency(summary.totalBookValue)}
          </div>
          <div className={`text-sm mt-1 ${percentChange >= 0 ? 'text-success' : 'text-red-600'}`}>
            {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}% vs melt ({formatCurrency(summary.totalMeltValue)})
          </div>
        </div>
      </div>

      {/* Valuation Breakdown Section */}
      {breakdown && (breakdown.spotPremium.count > 0 || breakdown.guidePrice.count > 0 || breakdown.custom.count > 0) && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            Valuation Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Spot + Premium */}
            {breakdown.spotPremium.count > 0 && (
              <div className="bg-surface-secondary rounded-lg p-4">
                <div className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                  Spot + Premium
                </div>
                <div className="text-xl font-bold text-text-primary font-mono">
                  {formatCurrency(breakdown.spotPremium.totalValue)}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {breakdown.spotPremium.count} item{breakdown.spotPremium.count !== 1 ? 's' : ''}
                </div>
                <div className={`text-sm mt-1 ${breakdown.spotPremium.avgPremiumPercent >= 0 ? 'text-success' : 'text-red-600'}`}>
                  Avg premium: {breakdown.spotPremium.avgPremiumPercent >= 0 ? '+' : ''}{breakdown.spotPremium.avgPremiumPercent.toFixed(1)}%
                </div>
              </div>
            )}

            {/* Guide Price */}
            {breakdown.guidePrice.count > 0 && (
              <div className="bg-surface-secondary rounded-lg p-4">
                <div className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                  Guide Price
                </div>
                <div className="text-xl font-bold text-text-primary font-mono">
                  {formatCurrency(breakdown.guidePrice.totalValue)}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {breakdown.guidePrice.count} item{breakdown.guidePrice.count !== 1 ? 's' : ''}
                </div>
                <div className={`text-sm mt-1 ${breakdown.guidePrice.premiumOverMelt >= 0 ? 'text-success' : 'text-red-600'}`}>
                  {breakdown.guidePrice.premiumOverMelt >= 0 ? '+' : ''}{breakdown.guidePrice.premiumOverMelt.toFixed(1)}% over melt
                </div>
              </div>
            )}

            {/* Custom */}
            {breakdown.custom.count > 0 && (
              <div className="bg-surface-secondary rounded-lg p-4">
                <div className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                  Custom Value
                </div>
                <div className="text-xl font-bold text-text-primary font-mono">
                  {formatCurrency(breakdown.custom.totalValue)}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {breakdown.custom.count} item{breakdown.custom.count !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  Fixed value
                </div>
              </div>
            )}
          </div>

          {/* Last Sync Date */}
          {breakdown.lastSyncDate && (
            <div className="text-xs text-text-secondary mt-3">
              Prices updated: {new Date(breakdown.lastSyncDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
