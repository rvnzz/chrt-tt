import { Stack } from 'expo-router/stack';

export const unstable_settings = {
  // Первая вкладка приложения — «Расписание» (маршрут "/"),
  // этой группе задаём явный якорь, чтобы / и /teacher(ы) не конфликтовали
  anchor: 'teachers',
};

export default function TeachersStack() {
  return (
    <Stack>
      <Stack.Screen name="teachers" options={{ title: 'Преподаватели' }} />
      <Stack.Screen name="t/[id]" options={{ title: 'Пары' }} />
    </Stack>
  );
}
