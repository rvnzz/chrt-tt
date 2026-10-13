import { Platform, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

type Props = { size?: number };

/** Иконка «настройки»: SF Symbol на iOS, глиф — на Android */
export function SettingsIcon({ size = 22 }: Props) {
  const theme = useTheme();

  if (Platform.OS === 'ios') {
    return <SymbolView size={size} name="gearshape" tintColor={theme.text} />;
  }

  return <Text style={{ fontSize: size * 0.95 }}>⚙︎</Text>;
}
