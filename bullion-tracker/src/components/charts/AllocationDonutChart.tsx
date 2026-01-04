'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AllocationDonutChartProps {
  goldOz: number;
  silverOz: number;
  platinumOz: number;
  goldPrice: number;
  silverPrice: number;
  platinumPrice: number;
}

const COLORS = {
  gold: '#D4AF37',
  silver: '#71706E',
  platinum: '#8D9093',
};

export function AllocationDonutChart({
  goldOz,
  silverOz,
  platinumOz,
  goldPrice,
  silverPrice,
  platinumPrice,
}: AllocationDonutChartProps) {
  // Calculate melt values
  const goldValue = goldOz * goldPrice;
  const silverValue = silverOz * silverPrice;
  const platinumValue = platinumOz * platinumPrice;
  const totalValue = goldValue + silverValue + platinumValue;

  // If no data, don't render
  if (totalValue === 0) {
    return null;
  }

  // Build data array with only metals that have value
  const data = [];
  if (goldValue > 0) {
    data.push({
      name: 'Gold',
      value: goldValue,
      percentage: (goldValue / totalValue) * 100,
    });
  }
  if (silverValue > 0) {
    data.push({
      name: 'Silver',
      value: silverValue,
      percentage: (silverValue / totalValue) * 100,
    });
  }
  if (platinumValue > 0) {
    data.push({
      name: 'Platinum',
      value: platinumValue,
      percentage: (platinumValue / totalValue) * 100,
    });
  }

  return (
    <div className="flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={50}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
