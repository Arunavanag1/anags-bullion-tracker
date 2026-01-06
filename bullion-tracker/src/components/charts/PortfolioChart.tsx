'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCollection, usePortfolioHistory } from '@/hooks/useCollection';
import { Card } from '@/components/ui/Card';
import type { TimeRange } from '@/types';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '24H', label: '24H' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '1Y', label: '1Y' },
  { value: '5Y', label: '5Y' },
];

type CategoryFilter = 'all' | 'bullion' | 'numismatic';

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bullion', label: 'Bullion' },
  { value: 'numismatic', label: 'Numismatic' },
];

const formatYAxisValue = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
};

export function PortfolioChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const { data: collection } = useCollection();
  const { data: chartData, isLoading } = usePortfolioHistory(timeRange);

  // Filter and transform data based on category selection
  const filteredData = useMemo(() => {
    if (!chartData) return [];

    return chartData.map((point) => {
      let displayValue: number;

      switch (categoryFilter) {
        case 'bullion':
          displayValue = point.bullionValue;
          break;
        case 'numismatic':
          displayValue = point.numismaticValue;
          break;
        case 'all':
        default:
          displayValue = point.totalValue;
          break;
      }

      return {
        ...point,
        displayValue,
      };
    });
  }, [chartData, categoryFilter]);

  // Calculate Y-axis domain with proper padding
  const yAxisDomain = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [0, 100];

    const values = filteredData.map((d) => d.displayValue).filter((v) => v > 0);
    if (values.length === 0) return [0, 100];

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add 10% padding on top and bottom
    const padding = (max - min) * 0.1 || max * 0.1;
    const domainMin = Math.max(0, min - padding);
    const domainMax = max + padding;

    return [domainMin, domainMax];
  }, [filteredData]);

  if (!collection || collection.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-text-secondary">
          Add items to your collection to see portfolio value over time
        </div>
      </Card>
    );
  }

  const getCategoryLabel = () => {
    switch (categoryFilter) {
      case 'bullion':
        return 'Bullion';
      case 'numismatic':
        return 'Numismatic';
      default:
        return 'Portfolio';
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">VALUE OVER TIME</h3>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeRange === range.value
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">Show:</span>
            <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setCategoryFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    categoryFilter === filter.value
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">Loading chart data...</div>
            </div>
          ) : filteredData && filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData}
                margin={{ top: 20, right: 20, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6DC" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8B6B61"
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                  axisLine={{ stroke: '#F5E6DC' }}
                />
                <YAxis
                  stroke="#8B6B61"
                  style={{ fontSize: '11px' }}
                  tickFormatter={formatYAxisValue}
                  domain={yAxisDomain}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F5E6DC',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number | undefined) => [
                    `$${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    getCategoryLabel() + ' Value',
                  ]}
                  labelStyle={{ color: '#2D1B1B', fontWeight: 600, marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="displayValue"
                  stroke="#C9A227"
                  strokeWidth={2.5}
                  dot={false}
                  name={getCategoryLabel() + ' Value'}
                  activeDot={{ r: 6, fill: '#C9A227', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">
                {categoryFilter !== 'all'
                  ? `No ${categoryFilter} items in your collection`
                  : 'No data available for this time range'}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="w-4 h-0.5 bg-[#C9A227] rounded"></div>
          <span>{getCategoryLabel()} Value</span>
        </div>
      </div>
    </Card>
  );
}
