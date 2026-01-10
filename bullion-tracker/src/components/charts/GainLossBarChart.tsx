'use client';

import { useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';
import { CollectionItem, SpotPricesResponse } from '@/types';
import { calculateCurrentBookValue, calculateCurrentMeltValue, getPurchasePrice, formatCurrency, formatPercent } from '@/lib/calculations';
import { exportChartAsPNG, exportDataAsCSV } from '@/lib/exportUtils';

interface GainLossBarChartProps {
  collection: CollectionItem[];
  spotPrices: SpotPricesResponse;
  valuationMode?: 'spot' | 'book';
}

interface MetalData {
  name: string;
  gainLoss: number;
  displayGainLoss: number; // For bar rendering with minimum width
  percentChange: number;
  currentValue: number;
  costBasis: number;
  color: string;
  [key: string]: string | number;
}

const POSITIVE_COLOR = '#22C55E';
const NEGATIVE_COLOR = '#EF4444';
const NEUTRAL_COLOR = '#9CA3AF'; // Gray for near-zero values

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

export function GainLossBarChart({ collection, spotPrices, valuationMode = 'spot' }: GainLossBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
      // Use melt value for "spot" mode, book value for "book" mode
      const currentValue = valuationMode === 'spot'
        ? calculateCurrentMeltValue(item, spotPrice)
        : calculateCurrentBookValue(item, spotPrice);
      const costBasis = getPurchasePrice(item);

      metalTotals[item.metal].currentValue += currentValue;
      metalTotals[item.metal].costBasis += costBasis;
    });

    // Build chart data
    const rawData = Object.entries(metalTotals)
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
        };
      })
      .sort((a, b) => b.gainLoss - a.gainLoss);

    // Calculate minimum bar width (3% of the max absolute value)
    const maxAbsGainLoss = Math.max(...rawData.map(d => Math.abs(d.gainLoss)), 1);
    const minBarValue = maxAbsGainLoss * 0.03;

    const data: MetalData[] = rawData.map(item => {
      // Ensure bar is visible by using minimum display value
      let displayGainLoss = item.gainLoss;
      if (Math.abs(item.gainLoss) < minBarValue && item.gainLoss !== 0) {
        displayGainLoss = item.gainLoss >= 0 ? minBarValue : -minBarValue;
      } else if (item.gainLoss === 0) {
        // Show a small neutral bar for exactly zero
        displayGainLoss = minBarValue * 0.5;
      }

      // Determine color based on actual gain/loss
      let color = NEUTRAL_COLOR;
      if (item.gainLoss > 0) color = POSITIVE_COLOR;
      else if (item.gainLoss < 0) color = NEGATIVE_COLOR;

      return {
        ...item,
        displayGainLoss,
        color,
      };
    });

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
  }, [collection, spotPrices, valuationMode]);

  const handleExportPNG = async () => {
    if (chartRef.current) {
      const timestamp = new Date().toISOString().split('T')[0];
      await exportChartAsPNG(chartRef.current, `gainloss-chart-${timestamp}`);
    }
  };

  const handleExportCSV = () => {
    if (chartData && chartData.length > 0) {
      const timestamp = new Date().toISOString().split('T')[0];
      const csvData = chartData.map((d) => ({
        Metal: d.name,
        'Current Value': d.currentValue.toFixed(2),
        'Cost Basis': d.costBasis.toFixed(2),
        'Gain/Loss': d.gainLoss.toFixed(2),
        'Percent Change': d.percentChange.toFixed(2),
      }));
      exportDataAsCSV(csvData, `gainloss-data-${timestamp}`, ['Metal', 'Current Value', 'Cost Basis', 'Gain/Loss', 'Percent Change']);
    }
  };

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
      <div ref={chartRef} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">GAIN / LOSS BY METAL</h3>
          {/* Export Buttons */}
          <div className="flex gap-1">
            <button
              onClick={handleExportPNG}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors"
              title="Export as PNG"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button
              onClick={handleExportCSV}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors"
              title="Export as CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </button>
          </div>
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
                <Bar dataKey="displayGainLoss" radius={[0, 4, 4, 0]} barSize={24}>
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
