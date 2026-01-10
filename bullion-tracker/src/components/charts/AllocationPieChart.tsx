'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/Card';
import { CollectionItem, SpotPricesResponse } from '@/types';
import { calculateCurrentBookValue, formatCurrency } from '@/lib/calculations';

type ViewMode = 'metal' | 'category';

interface AllocationPieChartProps {
  collection: CollectionItem[];
  spotPrices: SpotPricesResponse;
}

const METAL_COLORS: Record<string, string> = {
  gold: '#C9A227',
  silver: '#9CA3AF',
  platinum: '#6B7280',
};

const CATEGORY_COLORS: Record<string, string> = {
  BULLION: '#C9A227',
  NUMISMATIC: '#4F46E5',
};

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
  [key: string]: string | number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataItem;
    return (
      <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-text-primary">{data.name}</p>
        <p className="text-text-secondary">{formatCurrency(data.value)}</p>
        <p className="text-sm text-text-secondary">{data.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Don't show labels for slices less than 5%

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: '12px', fontWeight: 600 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function AllocationPieChart({ collection, spotPrices }: AllocationPieChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('metal');

  const { chartData, totalValue } = useMemo(() => {
    if (!collection || collection.length === 0 || !spotPrices) {
      return { chartData: [], totalValue: 0 };
    }

    // Calculate values by metal or category
    const totals: Record<string, number> = {};
    let total = 0;

    collection.forEach((item) => {
      const spotPrice = spotPrices[item.metal]?.pricePerOz || 0;
      const value = calculateCurrentBookValue(item, spotPrice);

      if (viewMode === 'metal') {
        const metalName = item.metal.charAt(0).toUpperCase() + item.metal.slice(1);
        totals[metalName] = (totals[metalName] || 0) + value;
      } else {
        const category = item.category || 'BULLION';
        totals[category] = (totals[category] || 0) + value;
      }

      total += value;
    });

    const data: ChartDataItem[] = Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => {
        const colorKey = viewMode === 'metal'
          ? name.toLowerCase()
          : name;
        const colors = viewMode === 'metal' ? METAL_COLORS : CATEGORY_COLORS;

        return {
          name: viewMode === 'category'
            ? (name === 'BULLION' ? 'Bullion' : 'Numismatic')
            : name,
          value,
          color: colors[colorKey] || '#6B7280',
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);

    return { chartData: data, totalValue: total };
  }, [collection, spotPrices, viewMode]);

  if (!collection || collection.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-text-secondary">
          Add items to your collection to see allocation
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">PORTFOLIO ALLOCATION</h3>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('metal')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'metal'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Metal
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'category'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Category
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-[280px] relative">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-text-secondary">Total</p>
                  <p className="text-lg font-semibold text-text-primary">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">No allocation data available</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-text-secondary">
                {entry.name} ({entry.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
