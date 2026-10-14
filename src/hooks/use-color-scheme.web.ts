import { ColorSchemeName } from 'react-native';

/**
 * Web: форсированная тёмная тема (не зависит от системной).
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  return 'dark';
}
