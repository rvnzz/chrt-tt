import { Stack, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import { collectTeacherWeek } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { SettingsIcon } from '@/components/settings-icon';
import { RoleFlow } from '@/components/onboarding/role-flow';
import { ScheduleDayView } from '@/components/schedule/schedule-day-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { useMyTeacher, useUserRole } from '@/hooks/use-user';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, formatDate, todayISO, weekdayFull } from '@/utils/date';

export default function ScheduleScreen() {
  const router = useRouter();
  const [role] = useUserRole();
  const [group] = useSelectedGroup();
  const [myTeacher] = useMyTeacher();
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);

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

  // Просмотр чужих групп живёт только в табе «Просмотр»
  const isTeacher = role === 'teacher';

  return (
    <ThemedView style={styles.flex}>
      {isTeacher ? (
        <Stack.Screen
          options={{
            title: myTeacher!.name,
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/profile')}
                hitSlop={10}
                style={({ pressed }) => pressed && styles.pressed}>
                <SettingsIcon />
              </Pressable>
            ),
          }}
        />
      ) : (
        <Stack.Screen
          options={{
            title: group!.name,
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/profile')}
                hitSlop={10}
                style={({ pressed }) => pressed && styles.pressed}>
                <SettingsIcon />
              </Pressable>
            ),
          }}
        />
      )}

      {isTeacher ? (
        <TeacherDay
          anchor={anchor}
          rawAnchor={rawAnchor}
          onAnchorChange={setRawAnchor}
          teacherId={myTeacher!.id}
          teacherName={myTeacher!.name}
          week={week}
        />
      ) : (
        <ScheduleDayView group={group!} />
      )}
    </ThemedView>
  );
}

/** Дневное расписание преподавателя (руки остаются в компоненте ScheduleDayView, здесь — варианты кард) */
type TeacherDayProps = {
  anchor: string;
  rawAnchor: string;
  onAnchorChange: (nextISO: string) => void;
  teacherId: number;
  teacherName: string;
  week: {
    isFetching: boolean;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    data: any;
  };
};

export function TeacherDay({
  rawAnchor,
  onAnchorChange,
  teacherId,
  teacherName,
  week,
}: TeacherDayProps) {
  const days = useMemo(
    () => (week.data ? collectTeacherWeek(week.data, teacherId) : []),
    [week.data, teacherId],
  );
  const bellMap = useBellMap(days.map((day) => day.date));
  void rawAnchor;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
      }>
      {week.isLoading ? (
        <View style={styles.list}>
          <PairSkeleton />
          <PairSkeleton />
          <PairSkeleton />
        </View>
      ) : week.isError ? (
        <EmptyState
          emoji="📡"
          title="Не удалось загрузить расписание"
          actionLabel="Повторить"
          onAction={() => week.refetch()}
        />
      ) : days.length === 0 ? (
        <EmptyState emoji="☕" title="На этой неделе пар нет" />
      ) : (
        days.map((day) => (
          <View key={day.date} style={styles.daySection}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.dayHeader}>
              {weekdayFull(day.date)}, {formatDate(day.date)}
            </ThemedText>
            <View style={styles.list}>
              {day.items.map((assignment, index) => (
                <AssignmentCard
                  key={`${assignment.pair_number}-${index}`}
                  assignment={assignment}
                  time={pairTimeMap(bellMap.get(day.date)).get(assignment.pair_number)}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentWidth: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  daySection: {
    gap: Spacing.two,
  },
  dayHeader: {
    marginLeft: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  previewText: {
    flex: 1,
  },
  returnButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
