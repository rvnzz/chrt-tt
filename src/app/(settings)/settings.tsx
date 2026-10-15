import { SettingsView } from '@/components/settings/settings-view';
import { ThemedView } from '@/components/themed-view';

/** Настройки как таб (iOS / web). На Android таб скрыт — модаль внутри (settings-modal). */
export default function SettingsScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SettingsView />
    </ThemedView>
  );
}
