import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import { collectTeacherWeek } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { WeekNav } from '@/components/schedule/week-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { formatDate, todayISO, weekdayFull } from '@/utils/date';

export default function TeacherScreen() {
  const params = useLocalSearchParams<{ id: string; name: string }>();
  const [anchor, setAnchor] = useState(todayISO());
  const week = useWeek(anchor);
  const teacherId = Number(params.id);

  const days = useMemo(
    () => (week.data ? collectTeacherWeek(week.data, teacherId) : []),
    [week.data, teacherId],
  );
  const bellMap = useBellMap(days.map((day) => day.date));

  if (Number.isNaN(teacherId)) {
    return (
      <ThemedView style={styles.flex}>
        <EmptyState emoji="🤷" title="Преподаватель не найден" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: typeof params.name === 'string' ? params.name : 'Преподаватель' }} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
        }>
        <WeekNav date={anchor} onChange={setAnchor} week={week.data} />

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
});
