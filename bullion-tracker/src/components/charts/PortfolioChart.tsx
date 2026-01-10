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
  { value: 'custom', label: 'Custom' },
];

type CategoryFilter = 'all' | 'bullion' | 'numismatic';
type ScaleMode = 'auto' | 'fromZero' | 'custom';

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bullion', label: 'Bullion' },
  { value: 'numismatic', label: 'Numismatic' },
];

const SCALE_OPTIONS: { value: ScaleMode; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Zoom to fit data' },
  { value: 'fromZero', label: 'From $0', description: 'Start Y-axis at zero' },
  { value: 'custom', label: 'Custom', description: 'Set custom range' },
];

// Improved Y-axis formatting based on value magnitude
const formatYAxisValue = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else if (value >= 100) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  // For values under $100, show cents
  return `$${value.toFixed(2)}`;
};

// X-axis formatter based on time range
const getXAxisFormatter = (timeRange: TimeRange, customDayRange?: number) => {
  // For custom range, determine appropriate format based on span
  if (timeRange === 'custom' && customDayRange !== undefined) {
    if (customDayRange <= 1) return formatXAxisHour;
    if (customDayRange <= 7) return formatXAxisDayName;
    if (customDayRange <= 60) return formatXAxisDate;
    if (customDayRange <= 400) return formatXAxisMonth;
    return formatXAxisMonthYear;
  }

  switch (timeRange) {
    case '24H':
      return formatXAxisHour;
    case '1W':
      return formatXAxisDayName;
    case '1M':
      return formatXAxisDate;
    case '1Y':
      return formatXAxisMonth;
    case '5Y':
      return formatXAxisMonthYear;
    default:
      return formatXAxisDate;
  }
};

// Recharts tickFormatter type: (value: any, index: number) => string
type TickFormatter = (value: string, index: number) => string;

// Format for 24H: "12 PM", "3 PM"
const formatXAxisHour: TickFormatter = (value) => value;

// Format for 1W: "Mon", "Tue"
const formatXAxisDayName: TickFormatter = (value) => value;

// Format for 1M: "Jan 5", "Jan 10"
const formatXAxisDate: TickFormatter = (value) => value;

// Format for 1Y: "Jan", "Feb"
const formatXAxisMonth: TickFormatter = (value) => {
  // Extract just the month from strings like "Jan 5"
  const parts = value.split(' ');
  return parts[0];
};

// Format for 5Y: "Jan '22"
const formatXAxisMonthYear: TickFormatter = (value) => value;

// Helper to get default dates (last 30 days)
const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export function PortfolioChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [scaleMode, setScaleMode] = useState<ScaleMode>('auto');
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');
  const [showScaleOptions, setShowScaleOptions] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(getDefaultDates().start);
  const [customEndDate, setCustomEndDate] = useState<string>(getDefaultDates().end);
  const { data: collection } = useCollection();
  const { data: chartData, isLoading } = usePortfolioHistory({
    timeRange,
    customStartDate: timeRange === 'custom' ? customStartDate : undefined,
    customEndDate: timeRange === 'custom' ? customEndDate : undefined,
  });

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

  // Calculate custom day range for X-axis formatting
  const customDayRange = useMemo(() => {
    if (timeRange !== 'custom' || !customStartDate || !customEndDate) return undefined;
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [timeRange, customStartDate, customEndDate]);

  // Get appropriate X-axis tick formatter
  const xAxisTickFormatter = useMemo(() => {
    return getXAxisFormatter(timeRange, customDayRange);
  }, [timeRange, customDayRange]);

  // Calculate Y-axis domain based on scale mode
  const yAxisDomain = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [0, 100];

    const values = filteredData.map((d) => d.displayValue).filter((v) => v > 0);
    if (values.length === 0) return [0, 100];

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    switch (scaleMode) {
      case 'fromZero':
        // Start from zero with 10% padding on top
        return [0, dataMax * 1.1];

      case 'custom':
        // Use custom values if provided, otherwise fall back to auto
        const parsedMin = parseFloat(customMin);
        const parsedMax = parseFloat(customMax);
        if (!isNaN(parsedMin) && !isNaN(parsedMax) && parsedMax > parsedMin) {
          return [parsedMin, parsedMax];
        }
        // Fall through to auto if custom values are invalid

      case 'auto':
      default:
        // Add 10% padding on top and bottom
        const padding = (dataMax - dataMin) * 0.1 || dataMax * 0.1;
        const domainMin = Math.max(0, dataMin - padding);
        const domainMax = dataMax + padding;
        return [domainMin, domainMax];
    }
  }, [filteredData, scaleMode, customMin, customMax]);

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

          {/* Custom Date Range Inputs */}
          {timeRange === 'custom' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">Range:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-32 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <span className="text-text-secondary">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-32 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
          )}

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

          {/* Scale Options */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">Scale:</span>
            <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
              {SCALE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setScaleMode(option.value);
                    if (option.value === 'custom') {
                      setShowScaleOptions(true);
                    } else {
                      setShowScaleOptions(false);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    scaleMode === option.value
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Scale Inputs */}
          {scaleMode === 'custom' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">Range:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-24 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <span className="text-text-secondary">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-24 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
          )}
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
                  tickFormatter={xAxisTickFormatter}
                  interval="preserveStartEnd"
                  minTickGap={40}
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
