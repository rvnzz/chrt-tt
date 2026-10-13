import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import { collectRoomWeek } from '@/api/derive';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { WeekNav } from '@/components/schedule/week-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useWeek } from '@/hooks/use-week';
import { formatDate, todayISO, weekdayFull } from '@/utils/date';

export default function RoomScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const roomName = typeof params.name === 'string' ? params.name : '';
  const [anchor, setAnchor] = useState(todayISO());
  const week = useWeek(anchor);

  const days = useMemo(
    () => (roomName && week.data ? collectRoomWeek(week.data, roomName) : []),
    [week.data, roomName],
  );

  if (!roomName) {
    return (
      <ThemedView style={styles.flex}>
        <EmptyState emoji="🤷" title="Кабинет не найден" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: `Ауд. ${roomName}` }} />

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
            title="Не удалось загрузить занятость"
            actionLabel="Повторить"
            onAction={() => week.refetch()}
          />
        ) : days.length === 0 ? (
          <EmptyState emoji="🚪" title="Кабинет свободен" description="На этой неделе занятий здесь нет." />
        ) : (
          days.map((day) => (
            <View key={day.date} style={styles.daySection}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.dayHeader}>
                {weekdayFull(day.date)}, {formatDate(day.date)}
              </ThemedText>
              <View style={styles.list}>
                {day.items.map((assignment, index) => (
                  <AssignmentCard key={`${assignment.pair_number}-${index}`} assignment={assignment} mode="room" />
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
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  contentWidth: {
    alignSelf: 'center',
    width: '100%',
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
