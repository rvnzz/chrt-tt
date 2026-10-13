import { Stack } from 'expo-router/stack';

export default function PeekStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Просмотр группы' }} />
    </Stack>
  );
}
