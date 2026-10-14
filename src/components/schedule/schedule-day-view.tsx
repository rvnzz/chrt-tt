import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { collectDays, collectGroupWeek, collectTeacherWeek, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { DayStrip } from '@/components/schedule/day-strip';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { PairCard } from '@/components/schedule/pair-card';
import { WeekNav } from '@/components/schedule/week-nav';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SelectedGroup } from '@/hooks/use-selected-group';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, formatDate, todayISO, weekdayFull, weekdayIndex } from '@/utils/date';

type Props = {
  /** Расписание группы (студент / «Просмотр») */
  group?: SelectedGroup;
  /** Расписание преподавателя (роль «учитель» на главном экране) */
  teacherId?: number;
  /** Плашка над навигацией (например, «вы смотрите … / ваша — …») */
  banner?: ReactNode;
  /** Только недельный режим (таб «Просмотр»): полоса дней и свайп-тумблер скрыты */
  weekOnly?: boolean;
};

type Mode = 'day' | 'week';

/**
 * Расписание группы или преподавателя.
 * Полоса дней Пн–Сб: свайп по ней — раскрыть неделю, ещё свайп — вернуться.
 * (В режиме weekOnly полоса и свайп-тумблер скрыты.)
 */
export function ScheduleDayView({ group, teacherId, banner, weekOnly = false }: Props) {
  const [mode, setMode] = useState<Mode>(weekOnly ? 'week' : 'day');
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);

  const weekDays = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(weekDays.map((day) => day.date));

  // Данные недели: группа или преподаватель (воскресенье везде отфильтровано)
  const groupDays = week.data && group ? collectGroupWeek(week.data, group) : [];

  const teacherDays = useMemo(
    () =>
      week.data && teacherId
        ? collectTeacherWeek(week.data, teacherId).filter(
            (day) => weekdayIndex(day.date) !== 6,
          )
        : [],
    [week.data, teacherId],
  );

  const dayPairs = week.data && group ? findGroupPairs(week.data, group, anchor) : [];
  const dayItems =
    teacherDays.find((day) => day.date === anchor)?.items ?? [];

  const selectedDay = week.data?.days.find((day) => day.date === anchor);
  const isTeacher = !!teacherId;

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

        {/* Полоса дней: только в обычном режиме */}
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
              {isTeacher ? (
                dayItems.length > 0 ? (
                  dayItems.map((assignment, index) => (
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
        ) : isTeacher ? (
          teacherDays.map((day) => (
            <View key={day.date} style={styles.weekSection}>
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
        ) : (
          groupDays.map((day) => (
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
