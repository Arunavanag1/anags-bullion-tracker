import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../lib/colors';

interface AllocationDonutChartProps {
  goldOz: number;
  silverOz: number;
  platinumOz: number;
  goldPrice: number;
  silverPrice: number;
  platinumPrice: number;
}

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

  // Calculate percentages
  const goldPercent = (goldValue / totalValue) * 100;
  const silverPercent = (silverValue / totalValue) * 100;
  const platinumPercent = (platinumValue / totalValue) * 100;

  const size = 120;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash offsets for each segment
  let currentOffset = 0;

  const goldDash = (goldPercent / 100) * circumference;
  const silverDash = (silverPercent / 100) * circumference;
  const platinumDash = (platinumPercent / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Gold segment */}
          {goldValue > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={Colors.gold}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${goldDash} ${circumference - goldDash}`}
              strokeDashoffset={0}
            />
          )}

          {/* Silver segment */}
          {silverValue > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={Colors.silver}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${silverDash} ${circumference - silverDash}`}
              strokeDashoffset={-goldDash}
            />
          )}

          {/* Platinum segment */}
          {platinumValue > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={Colors.platinum}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${platinumDash} ${circumference - platinumDash}`}
              strokeDashoffset={-(goldDash + silverDash)}
            />
          )}
        </G>
      </Svg>
    </View>
  );
}
