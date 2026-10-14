import * as Haptics from 'expo-haptics';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';

import { WeekNav } from '@/components/schedule/week-nav';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { PairCard } from '@/components/schedule/pair-card';
import { collectDays, collectTeacherWeek, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SelectedGroup } from '@/hooks/use-selected-group';
import { useTheme } from '@/hooks/use-theme';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, todayISO, weekdayFull, weekdayShort } from '@/utils/date';

type Props = {
  group?: SelectedGroup;
  teacherId?: number;
};

/** Дневное расписание: WeekNav + полоса дней (в одной карточке фиксированной высоты). */
export function ScheduleDayView({ group, teacherId }: Props) {
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);
  const theme = useTheme();

  const days = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(days.map((day) => day.date));

  const dayPairs = week.data && group ? findGroupPairs(week.data, group, anchor) : [];
  const teacherDayItems =
    (week.data && teacherId
      ? collectTeacherWeek(week.data, teacherId).find((day) => day.date === anchor)?.items ?? []
      : []);

  const selectedDay = week.data?.days.find((day) => day.date === anchor);
  const isTeacher = !!teacherId;

  // Реаутентификатор для Gesture API больше не нужен — жестов в этом виде нет

  return (
    <View style={styles.flex}>
      {/* Полоса: WeekNav + чипы дней (фиксированная высота) */}
      <View style={[styles.contentWidth, styles.strip]}>
        <View style={styles.weekNavRow}>
          <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />
        </View>

        {week.data ? (
          <View style={styles.chipsRow}>
            {days.map((day) => (
              <DayChip
                key={day.date}
                date={day.date}
                hasSchedule={day.hasSchedule}
                isSelected={day.date === anchor}
                isToday={day.date === todayISO()}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') {
                    void Haptics.selectionAsync();
                  }
                  setRawAnchor(day.date);
                }}
                theme={theme}
              />
            ))}
          </View>
        ) : (
          <View style={styles.stripSkeleton} />
        )}
      </View>

      {/* Скролл-контент */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
        }>
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
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.dayHeader}>
              {weekdayFull(anchor)}
            </ThemedText>

            <View style={styles.list}>
              {isTeacher ? (
                teacherDayItems.length > 0 ? (
                  teacherDayItems.map((assignment, index) => (
                    <AssignmentCard
                      key={`${assignment.pair_number}-${index}`}
                      assignment={assignment}
                      time={pairTimeMap(bellMap.get(anchor)).get(assignment.pair_number)}
                    />
                  ))
                ) : (
                  <EmptyState
                    emoji="☕"
                    title="В этот день пар нет"
                    description={
                      selectedDay === undefined ? 'День вне диапазона этой недели.' : undefined
                    }
                  />
                )
              ) : dayPairs.length > 0 ? (
                dayPairs.map((pair) => (
                  <PairCard
                    key={pair.number}
                    pair={pair}
                    time={pairTimeMap(bellMap.get(anchor)).get(pair.number)}
                  />
                ))
              ) : (
                <EmptyState
                  emoji="☕"
                  title="Занятий нет"
                  description={
                    selectedDay === undefined
                      ? 'День вне диапазона этой недели.'
                      : selectedDay.has_schedule
                        ? `В этот день пар у группы ${group!.name} не запланировано.`
                        : 'Расписание на этот день не опубликовано.'
                  }
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DayChip({
  date,
  hasSchedule,
  isSelected,
  isToday,
  onPress,
  theme,
}: {
  date: string;
  hasSchedule: boolean;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isSelected && { backgroundColor: theme.backgroundSelected },
        pressed && { opacity: 0.7 },
      ]}>
      <ThemedText
        type="small"
        themeColor={isSelected ? 'text' : 'textSecondary'}
        style={styles.chipWeekday}>
        {weekdayShort(date)}
      </ThemedText>
      <ThemedText
        type="smallBold"
        themeColor={isSelected ? 'text' : 'textSecondary'}
        style={styles.chipNumber}>
        {Number(date.split('-')[2])}
      </ThemedText>

      <View style={styles.dotRow}>
        {!hasSchedule ? (
          <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
        ) : (
          isToday && <View style={[styles.dot, { backgroundColor: theme.text }]} />
        )}
      </View>
    </Pressable>
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
  strip: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  weekNavRow: {
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  stripSkeleton: {
    height: 72,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  chip: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    flex: 1,
    minWidth: 44,
  },
  chipWeekday: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipNumber: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  dotRow: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  dayHeader: {
    marginLeft: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
});
