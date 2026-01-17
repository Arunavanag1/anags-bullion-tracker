import { Platform } from 'react-native';
import { Colors } from './colors';

export const ChartTheme = {
  colors: {
    gold: Colors.gold,
    silver: Colors.silver,
    platinum: Colors.platinum,
    positive: Colors.positive,
    negative: Colors.negative,
    line: Colors.accentTeal,
    grid: Colors.border,
    axis: Colors.textSecondary,
  },
  axis: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.textSecondary,
  },
  animation: {
    type: 'timing' as const,
    duration: 300,
  },
  layout: {
    padding: { left: 40, right: 16, top: 16, bottom: 24 },
  },
};
