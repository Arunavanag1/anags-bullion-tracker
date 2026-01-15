import AsyncStorage from '@react-native-async-storage/async-storage';

const GAIN_DISPLAY_FORMAT_KEY = 'gain_display_format';

export type GainDisplayFormat = 'dollar' | 'percent';

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
