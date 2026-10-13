import { Platform, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

type Props = { size?: number };

/** Иконка «настройки»: SF Symbol на iOS, глиф — на Android. Цвет — из темы (виден на любом фоне). */
export function SettingsIcon({ size = 22 }: Props) {
  const theme = useTheme();

  if (Platform.OS === 'ios') {
    return <SymbolView size={size} name="gearshape" tintColor={theme.text} />;
  }

  return (
    <Text style={{ fontSize: Math.round(size * 0.95), color: theme.text }}>⚙</Text>
  );
}
