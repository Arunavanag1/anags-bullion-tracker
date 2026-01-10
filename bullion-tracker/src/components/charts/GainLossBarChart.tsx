'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';
import { CollectionItem, SpotPricesResponse } from '@/types';
import { calculateCurrentBookValue, getPurchasePrice, formatCurrency, formatPercent } from '@/lib/calculations';

interface GainLossBarChartProps {
  collection: CollectionItem[];
  spotPrices: SpotPricesResponse;
}

interface MetalData {
  name: string;
  gainLoss: number;
  percentChange: number;
  currentValue: number;
  costBasis: number;
  color: string;
  [key: string]: string | number;
}

const POSITIVE_COLOR = '#22C55E';
const NEGATIVE_COLOR = '#EF4444';

const formatYAxisValue = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MetalData;
    const isPositive = data.gainLoss >= 0;

    return (
      <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-text-primary mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p className="text-text-secondary">
            Current Value: <span className="font-medium">{formatCurrency(data.currentValue)}</span>
          </p>
          <p className="text-text-secondary">
            Cost Basis: <span className="font-medium">{formatCurrency(data.costBasis)}</span>
          </p>
          <p className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? 'Gain' : 'Loss'}: <span className="font-medium">{formatCurrency(Math.abs(data.gainLoss))}</span>
          </p>
          <p className={isPositive ? 'text-green-600' : 'text-red-600'}>
            Change: <span className="font-medium">{formatPercent(data.percentChange)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function GainLossBarChart({ collection, spotPrices }: GainLossBarChartProps) {
  const { chartData, totals } = useMemo(() => {
    if (!collection || collection.length === 0 || !spotPrices) {
      return {
        chartData: [],
        totals: { gainLoss: 0, percentChange: 0, currentValue: 0, costBasis: 0 },
      };
    }

    // Group by metal
    const metalTotals: Record<string, { currentValue: number; costBasis: number }> = {
      gold: { currentValue: 0, costBasis: 0 },
      silver: { currentValue: 0, costBasis: 0 },
      platinum: { currentValue: 0, costBasis: 0 },
    };

    collection.forEach((item) => {
      const spotPrice = spotPrices[item.metal]?.pricePerOz || 0;
      const currentValue = calculateCurrentBookValue(item, spotPrice);
      const costBasis = getPurchasePrice(item);

      metalTotals[item.metal].currentValue += currentValue;
      metalTotals[item.metal].costBasis += costBasis;
    });

    // Build chart data
    const data: MetalData[] = Object.entries(metalTotals)
      .filter(([, values]) => values.currentValue > 0 || values.costBasis > 0)
      .map(([metal, values]) => {
        const gainLoss = values.currentValue - values.costBasis;
        const percentChange = values.costBasis > 0
          ? ((values.currentValue - values.costBasis) / values.costBasis) * 100
          : 0;

        return {
          name: metal.charAt(0).toUpperCase() + metal.slice(1),
          gainLoss,
          percentChange,
          currentValue: values.currentValue,
          costBasis: values.costBasis,
          color: gainLoss >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR,
        };
      })
      .sort((a, b) => b.gainLoss - a.gainLoss);

    // Calculate totals
    const totalCurrentValue = data.reduce((sum, d) => sum + d.currentValue, 0);
    const totalCostBasis = data.reduce((sum, d) => sum + d.costBasis, 0);
    const totalGainLoss = totalCurrentValue - totalCostBasis;
    const totalPercentChange = totalCostBasis > 0
      ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100
      : 0;

    return {
      chartData: data,
      totals: {
        gainLoss: totalGainLoss,
        percentChange: totalPercentChange,
        currentValue: totalCurrentValue,
        costBasis: totalCostBasis,
      },
    };
  }, [collection, spotPrices]);

  if (!collection || collection.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-text-secondary">
          Add items to your collection to see gain/loss analysis
        </div>
      </Card>
    );
  }

  const isOverallPositive = totals.gainLoss >= 0;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">GAIN / LOSS BY METAL</h3>
        </div>

        {/* Chart */}
        <div className="w-full h-[200px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 60, bottom: 10 }}
              >
                <XAxis
                  type="number"
                  stroke="#8B6B61"
                  style={{ fontSize: '11px' }}
                  tickFormatter={formatYAxisValue}
                  tickLine={false}
                  axisLine={{ stroke: '#F5E6DC' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#8B6B61"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0} stroke="#8B6B61" strokeDasharray="3 3" />
                <Bar dataKey="gainLoss" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">No gain/loss data available</div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary uppercase">Total Portfolio</p>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(totals.currentValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary uppercase">Overall {isOverallPositive ? 'Gain' : 'Loss'}</p>
              <p className={`text-lg font-semibold ${isOverallPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isOverallPositive ? '+' : ''}{formatCurrency(totals.gainLoss)}
              </p>
              <p className={`text-sm ${isOverallPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(totals.percentChange)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
