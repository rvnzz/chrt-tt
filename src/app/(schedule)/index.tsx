import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { SettingsIcon } from '@/components/settings-icon';
import { RoleFlow } from '@/components/onboarding/role-flow';
import { ScheduleDayView } from '@/components/schedule/schedule-day-view';
import { ThemedView } from '@/components/themed-view';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { useMyTeacher, useUserRole } from '@/hooks/use-user';

export default function ScheduleScreen() {
  const router = useRouter();
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
  // На Android таба «Настройки» нет — доступ через иконку в шапке (сверху справа)
  const showSettingsIcon = process.env.EXPO_OS === 'android';
  const settingsHref = showSettingsIcon ? '/settings-modal' : null;

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          title: isTeacher ? myTeacher!.name : group!.name,
          headerRight:
            showSettingsIcon === false || !settingsHref
              ? undefined
              : () => (
                  <Pressable
                    onPress={() => router.push(settingsHref)}
                    hitSlop={10}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <SettingsIcon />
                  </Pressable>
                ),
        }}
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
  pressed: {
    opacity: 0.6,
  },
});
