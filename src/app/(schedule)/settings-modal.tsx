import { Stack } from 'expo-router';

import { SettingsView } from '@/components/settings/settings-view';
import { ThemedView } from '@/components/themed-view';

/** Настройки модалью внутри стека «Расписание» — путь для Android (таб скрыт). */
export default function SettingsModalScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Настройки', presentation: 'modal' }} />
      <SettingsView />
    </ThemedView>
  );
}
