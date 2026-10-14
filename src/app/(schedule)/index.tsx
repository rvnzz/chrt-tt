import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { RoleFlow } from '@/components/onboarding/role-flow';
import { ScheduleDayView } from '@/components/schedule/schedule-day-view';
import { ThemedView } from '@/components/themed-view';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { useMyTeacher, useUserRole } from '@/hooks/use-user';

export default function ScheduleScreen() {
  const [role] = useUserRole();
  const [group] = useSelectedGroup();
  const [myTeacher] = useMyTeacher();

  // Встроенный онбординг: без Redirect и навигации между роутами
  const profileComplete =
    (role === 'student' && !!group) || (role === 'teacher' && !!myTeacher);

  if (!role || !profileComplete) {
    return (
      <ThemedView style={styles.flex}>
        <Stack.Screen options={{ title: 'Профиль' }} />
        <RoleFlow />
      </ThemedView>
    );
  }

  const isTeacher = role === 'teacher';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{ title: isTeacher ? myTeacher!.name : group!.name }}
      />

      {isTeacher ? (
        <ScheduleDayView teacherId={myTeacher!.id} />
      ) : (
        <ScheduleDayView group={group!} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
