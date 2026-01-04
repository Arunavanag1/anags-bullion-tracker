import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ValuationMethod } from '../types';

const VALUATION_METHOD_KEY = 'valuation_method';
const GAIN_DISPLAY_FORMAT_KEY = 'gain_display_format';

export type GainDisplayFormat = 'dollar' | 'percent';

/**
 * Get the current valuation method
 */
export async function getValuationMethod(): Promise<ValuationMethod> {
  try {
    const method = await AsyncStorage.getItem(VALUATION_METHOD_KEY);
    return (method as ValuationMethod) || 'spot';
  } catch {
    return 'spot';
  }
}

/**
 * Set the valuation method
 */
export async function setValuationMethod(method: ValuationMethod): Promise<void> {
  try {
    await AsyncStorage.setItem(VALUATION_METHOD_KEY, method);
  } catch (error) {
    console.error('Failed to save valuation method:', error);
  }
}

/**
 * Get the current gain display format
 */
export async function getGainDisplayFormat(): Promise<GainDisplayFormat> {
  try {
    const format = await AsyncStorage.getItem(GAIN_DISPLAY_FORMAT_KEY);
    return (format as GainDisplayFormat) || 'dollar';
  } catch {
    return 'dollar';
  }
}

/**
 * Set the gain display format
 */
export async function setGainDisplayFormat(format: GainDisplayFormat): Promise<void> {
  try {
    await AsyncStorage.setItem(GAIN_DISPLAY_FORMAT_KEY, format);
  } catch (error) {
    console.error('Failed to save gain display format:', error);
  }
}
