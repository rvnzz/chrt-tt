import { SettingsView } from '@/components/settings/settings-view';
import { ThemedView } from '@/components/themed-view';
import { HeadTitle } from '@/components/head-title';

/** Настройки как таб (iOS / web). На Android таб скрыт — модаль внутри (settings-modal). */
export default function SettingsScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <HeadTitle title={ 'Настройки — Расписание ЧРТ' } />      <SettingsView />
    </ThemedView>
  );
}