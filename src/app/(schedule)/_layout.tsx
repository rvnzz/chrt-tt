import { Stack } from 'expo-router/stack';

export default function ScheduleStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Расписание' }} />
      <Stack.Screen name="groups" options={{ title: 'Выбор группы' }} />
      <Stack.Screen name="pick-teacher" options={{ title: 'Выберите себя' }} />
      <Stack.Screen name="profile" options={{ title: 'Профиль' }} />
    </Stack>
  );
}
