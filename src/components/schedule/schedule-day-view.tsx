import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { type ReactNode, useCallback, useState } from 'react';

import { collectDays, collectGroupWeek, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { DayStrip } from '@/components/schedule/day-strip';
import { PairCard } from '@/components/schedule/pair-card';
import { WeekNav } from '@/components/schedule/week-nav';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SelectedGroup } from '@/hooks/use-selected-group';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, formatDate, todayISO, weekdayFull } from '@/utils/date';

type Props = {
  group: SelectedGroup;
  /** Плашка над навигацией (например, «вы смотрите … / ваша — …») */
  banner?: ReactNode;
  /** Только недельный режим (таб «Просмотр»): полоса дней и свайп-тумблер скрыты */
  weekOnly?: boolean;
};

type Mode = 'day' | 'week';

/**
 * Расписание группы по дням.
 * Полоса дней Пн–Сб: свайп по ней — раскрыть неделю (секции по дням),
 * ещё свайп — вернуться к просмотру по дням (это же и тапом по полосе не трогается).
 */
export function ScheduleDayView({ group, banner, weekOnly = false }: Props) {
  const [mode, setMode] = useState<Mode>(weekOnly ? 'week' : 'day');
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);

  const weekDays = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(weekDays.map((day) => day.date));

  const pairs = week.data ? findGroupPairs(week.data, group, anchor) : [];
  const weekPairs = week.data ? collectGroupWeek(week.data, group) : [];
  const selectedDay = week.data?.days.find((day) => day.date === anchor);

  const toggleMode = useCallback(() => {
    if (!weekOnly) {
      setMode((current) => (current === 'day' ? 'week' : 'day'));
    }
  }, [weekOnly]);

  return (
    <View style={styles.flex}>
      {/* Хедер (вне скролла): недели + полоса дней (со свайпом) */}
      <View style={[styles.header, styles.contentWidth]}>
        {banner}
        <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />

        {/* Полоса дней: только в обычном режиме (в «недельном» табе её нет) */}
        {!weekOnly && (
          <DayStrip
            days={weekDays}
            selected={anchor}
            onSelect={setRawAnchor}
            onSwipe={toggleMode}
          />
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
        ) : mode === 'day' && !weekOnly ? (
          <>
            {/* Дата выбранного дня */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.dayHeader}>
              {weekdayFull(anchor)}
            </ThemedText>

            <View style={styles.list}>
              {pairs.length > 0 ? (
                pairs.map((pair) => (
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
                        ? `В этот день пар у группы ${group.name} не запланировано.`
                        : 'Расписание на этот день не опубликовано.'
                  }
                />
              )}
            </View>
          </>
        ) : (
          weekPairs.map((day) => (
            <View key={day.date} style={styles.weekSection}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.dayHeader}>
                {weekdayFull(day.date)}, {formatDate(day.date)}
              </ThemedText>
              <View style={styles.list}>
                {day.pairs.length > 0 ? (
                  day.pairs.map((pair) => (
                    <PairCard
                      key={pair.number}
                      pair={pair}
                      time={pairTimeMap(bellMap.get(day.date)).get(pair.number)}
                    />
                  ))
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Занятий нет
                  </ThemedText>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  header: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.two,
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
  weekSection: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
});
