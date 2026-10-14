import { Stack } from 'expo-router/stack';

export const unstable_settings = {
  anchor: 'peek',
};

export default function PeekStack() {
  return (
    <Stack>
      <Stack.Screen name="peek" options={{ title: 'Просмотр группы' }} />
    </Stack>
  );
}
