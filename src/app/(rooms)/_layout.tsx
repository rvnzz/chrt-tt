import { Stack } from 'expo-router/stack';

export const unstable_settings = {
  anchor: 'rooms',
};

export default function RoomsStack() {
  return (
    <Stack>
      <Stack.Screen name="rooms" options={{ title: 'Кабинеты' }} />
      <Stack.Screen name="r/[name]" options={{ title: 'Занятость' }} />
    </Stack>
  );
}
