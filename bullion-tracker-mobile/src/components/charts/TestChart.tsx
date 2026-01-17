import React from 'react';
import { CartesianChart, Line } from 'victory-native';
import { ChartContainer } from './ChartContainer';
import { ChartTheme } from '../../lib/chartTheme';

const TEST_DATA = [
  { x: 1, y: 100 },
  { x: 2, y: 150 },
  { x: 3, y: 125 },
  { x: 4, y: 200 },
  { x: 5, y: 175 },
];

export function TestChart() {
  return (
    <ChartContainer title="Victory Native Test" height={200}>
      <CartesianChart data={TEST_DATA} xKey="x" yKeys={['y']}>
        {({ points }) => (
          <Line
            points={points.y}
            color={ChartTheme.colors.line}
            strokeWidth={2}
            animate={ChartTheme.animation}
          />
        )}
      </CartesianChart>
    </ChartContainer>
  );
}
