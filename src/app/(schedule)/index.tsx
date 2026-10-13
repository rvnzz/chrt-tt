import { Stack, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { collectDays, collectTeacherWeek, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { DayStrip } from '@/components/schedule/day-strip';
import { PairCard } from '@/components/schedule/pair-card';
import { WeekNav } from '@/components/schedule/week-nav';
import { RoleFlow } from '@/components/onboarding/role-flow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { useMyTeacher, useUserRole } from '@/hooks/use-user';
import { useTheme } from '@/hooks/use-theme';
import { useBell } from '@/hooks/use-bell';
import { useWeek } from '@/hooks/use-week';
import { todayISO, weekdayFull } from '@/utils/date';

export default function ScheduleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [role] = useUserRole();
  const [group] = useSelectedGroup();
  const [myTeacher] = useMyTeacher();
  const [anchor, setAnchor] = useState(todayISO());
  const week = useWeek(anchor);
  const bell = useBell(anchor);
  const pairTimes = pairTimeMap(bell.data);

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

  const pairs = role === 'student' && week.data && group ? findGroupPairs(week.data, group, anchor) : [];
  const teacherDays =
    role === 'teacher' && week.data && myTeacher ? collectTeacherWeek(week.data, myTeacher.id) : [];
  const myDay = teacherDays.find((day) => day.date === anchor);
  const selectedDay = week.data?.days.find((day) => day.date === anchor);

  const title = role === 'teacher' ? myTeacher!.name : group!.name;
  const isTeacher = role === 'teacher';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                Сменить
              </ThemedText>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
        }>
        <WeekNav date={anchor} onChange={setAnchor} week={week.data} />

        {/* Выбор дня */}
        {week.data ? (
          <DayStrip days={collectDays(week.data)} selected={anchor} onSelect={setAnchor} />
        ) : (
          <View style={styles.stripSkeleton} />
        )}

        {/* Дата выбранного дня */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.dayHeader}>
          {weekdayFull(anchor)}
        </ThemedText>

        {/* Содержимое дня */}
        <View style={styles.list}>
          {week.isLoading ? (
            <>
              <PairSkeleton />
              <PairSkeleton />
              <PairSkeleton />
            </>
          ) : week.isError ? (
            <EmptyState
              emoji="📡"
              title="Не удалось загрузить расписание"
              description="Проверьте подключение к сети и попробуйте снова."
              actionLabel="Повторить"
              onAction={() => week.refetch()}
            />
          ) : !isTeacher ? (
            pairs.length > 0 ? (
            pairs.map((pair) => (
              <PairCard key={pair.number} pair={pair} time={pairTimes.get(pair.number)} />
            ))
            ) : (
              <EmptyState
                emoji="☕"
                title="Занятий нет"
                description={
                  selectedDay === undefined
                    ? 'День вне диапазона этой недели.'
                    : selectedDay.has_schedule
                      ? 'В этот день пар для группы не запланировано.'
                      : 'Расписание на этот день не опубликовано.'
                }
              />
            )
          ) : myDay && myDay.items.length > 0 ? (
            myDay.items.map((assignment, index) => (
              <AssignmentCard key={`${assignment.pair_number}-${index}`} assignment={assignment} />
            ))
          ) : (
            <EmptyState emoji="☕" title="Занятий нет" description="В этот день ваших пар не запланировано." />
          )}
        </View>
      </ScrollView>
    </ThemedView>
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
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  stripSkeleton: {
    height: 72,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  dayHeader: {
    marginTop: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
