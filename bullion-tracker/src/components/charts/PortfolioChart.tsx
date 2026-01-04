'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCollection, usePortfolioHistory } from '@/hooks/useCollection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { TimeRange } from '@/types';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '24H', label: '24H' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '1Y', label: '1Y' },
  { value: '5Y', label: '5Y' },
];

export function PortfolioChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const { data: collection } = useCollection();
  const { data: chartData, isLoading } = usePortfolioHistory(timeRange);

  if (!collection || collection.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-text-secondary">
          Add items to your collection to see portfolio value over time
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header with Time Range Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Portfolio Value</h3>
            <p className="text-sm text-text-secondary mt-1">
              Historical melt vs book value over time
            </p>
          </div>

          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                size="sm"
                variant={timeRange === range.value ? 'primary' : 'ghost'}
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">Loading chart data...</div>
            </div>
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6DC" />
                <XAxis
                  dataKey="date"
                  stroke="#8B6B61"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#8B6B61"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F5E6DC',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                  labelStyle={{ color: '#2D1B1B', fontWeight: 600, marginBottom: '8px' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="meltValue"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  name="Melt Value"
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="bookValue"
                  stroke="#E76F51"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Book Value"
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">No data available for this time range</div>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="text-xs text-text-secondary text-center">
          <strong>Note:</strong> Historical prices from curated database (2020-2024 monthly averages).
          Live current prices from Metal Price API.
          Values reflect your current holdings at historical market prices.
        </div>
      </div>
    </Card>
  );
}
