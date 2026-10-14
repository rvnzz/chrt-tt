import { Stack } from 'expo-router/stack';

export const unstable_settings = {
  anchor: 'settings',
};

export default function SettingsStack() {
  return (
    <Stack>
      <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
    </Stack>
  );
}
