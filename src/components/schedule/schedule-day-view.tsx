import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useState, type ReactNode } from 'react';

import { collectDays, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { DayStrip } from '@/components/schedule/day-strip';
import { PairCard } from '@/components/schedule/pair-card';
import { WeekNav } from '@/components/schedule/week-nav';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SelectedGroup } from '@/hooks/use-selected-group';
import { useBell } from '@/hooks/use-bell';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, todayISO, weekdayFull } from '@/utils/date';

type Props = {
  group: SelectedGroup;
  /** Плашка над навигацией (например, «вы смотрите … / ваша — …») */
  banner?: ReactNode;
};

/** Дневное расписание группы: неделя, дни (без воскресений), карточки пар со звонками. */
export function ScheduleDayView({ group, banner }: Props) {
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);
  const bell = useBell(anchor);
  const pairTimes = pairTimeMap(bell.data);

  const pairs = week.data ? findGroupPairs(week.data, group, anchor) : [];
  const selectedDay = week.data?.days.find((day) => day.date === anchor);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
      }>
      {banner}

      <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />

      {/* Выбор дня */}
      {week.data ? (
        <DayStrip days={collectDays(week.data)} selected={anchor} onSelect={setRawAnchor} />
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
        ) : pairs.length > 0 ? (
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
                  ? `В этот день пар у группы ${group.name} не запланировано.`
                  : 'Расписание на этот день не опубликовано.'
            }
          />
        )}
      </View>
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
});
