import { Stack, useRouter } from 'expo-router';

import { TeacherPickerList } from '@/components/schedule/teacher-picker-list';
import { ThemedView } from '@/components/themed-view';
import { useMyTeacher } from '@/hooks/use-user';

export default function PickTeacherScreen() {
  const router = useRouter();
  const [, setMyTeacher] = useMyTeacher();

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Выберите себя' }} />
      <TeacherPickerList
        onSelect={(teacher) => {
          setMyTeacher(teacher);
          router.back();
        }}
      />
    </ThemedView>
  );
}
