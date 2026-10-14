import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { type ReactNode, useState } from 'react';
import {
  Gesture,
  GestureDetector,
  Pressable,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { collectDays, collectGroupWeek, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { DayStrip } from '@/components/schedule/day-strip';
import { PairCard } from '@/components/schedule/pair-card';
import { WeekNav } from '@/components/schedule/week-nav';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SelectedGroup } from '@/hooks/use-selected-group';
import { useTheme } from '@/hooks/use-theme';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, formatDate, todayISO, weekdayFull } from '@/utils/date';

type Props = {
  group: SelectedGroup;
  /** Плашка над навигацией (например, «вы смотрите … / ваша — …») */
  banner?: ReactNode;
};

type Mode = 'day' | 'week';

/**
 * Расписание группы по дням. Свайп по «ручке»: вверх — неделя, вниз — день.
 * В режиме «неделя» — секции по дням.
 */
export function ScheduleDayView({ group, banner }: Props) {
  const [mode, setMode] = useState<Mode>('day');
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);
  const theme = useTheme();

  const weekDays = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(weekDays.map((day) => day.date));

  const pairs = week.data ? findGroupPairs(week.data, group, anchor) : [];
  const weekPairs = week.data ? collectGroupWeek(week.data, group) : [];
  const selectedDay = week.data?.days.find((day) => day.date === anchor);

  // Внешний ScrollView блокируется на время жеста (иначе они конфликтуют)
  const [outerScrollEnabled, setOuterScrollEnabled] = useState(true);

  const handleEnd = (translationY: number) => {
    setOuterScrollEnabled(true);
    if (translationY > 30 && mode === 'day') {
      setMode('week');
    } else if (translationY < -30 && mode === 'week') {
      setMode('day');
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-16, 16])
    .failOffsetX([-24, 24])
    .onStart(() => {
      'worklet';
      runOnJS(setOuterScrollEnabled)(false);
    })
    .onEnd((event: { translationY: number }) => {
      'worklet';
      runOnJS(handleEnd)(event.translationY);
    });

  const toggle = () => {
    setMode(mode === 'day' ? 'week' : 'day');
  };

  return (
    <ScrollView
      style={styles.flex}
      scrollEnabled={outerScrollEnabled}
      contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
      }>
      {banner}

      <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />

      {/* Ручка «день/неделя»: свайп вверх/вниз или тап */}
      <GestureDetector gesture={pan}>
        <Pressable onPress={toggle} style={styles.handle}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.handleHint}>
            {mode === 'day' ? '▼ неделя' : '▲ по дням'}
          </ThemedText>
          <View style={[styles.handleBar, { backgroundColor: theme.textSecondary }]} />
        </Pressable>
      </GestureDetector>
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
      ) : mode === 'day' ? (
        <>
          {/* Выбор дня */}
          {week.data ? (
            <DayStrip days={weekDays} selected={anchor} onSelect={setRawAnchor} />
          ) : (
            <View style={styles.stripSkeleton} />
          )}

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
  handle: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.one,
  },
  handleHint: {
    fontSize: 10,
    lineHeight: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  stripSkeleton: {
    height: 72,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  dayHeader: {
    marginTop: Spacing.one,
    marginLeft: Spacing.one,
  },
  weekSection: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
