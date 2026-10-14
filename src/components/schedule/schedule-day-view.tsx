import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Gesture, GestureDetector, Pressable, ScrollView } from 'react-native-gesture-handler';
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
 * Расписание группы по дням.
 * Ручка над списком: свайп вверх — неделя, свайп вниз / тап — по дням.
 * Ручка находится вне ScrollView, поэтому жесты не конфликтуют со скроллом.
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

  // Конец жеста — по актуальной mode: handlePanEnd в deps memo, пересоздание безопасно
  const handlePanEnd = useCallback(
    (translationY: number) => {
      if (translationY > 24 && mode === 'day') {
        setMode('week');
      } else if (translationY < -24 && mode === 'week') {
        setMode('day');
      }
    },
    [mode],
  );

  const pan = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY([-16, 16])
      .failOffsetX([-24, 24])
      .onEnd((event: { translationY: number }) => {
        'worklet';
        runOnJS(handlePanEnd)(event.translationY);
      });
  }, [handlePanEnd]);

  const toggle = () => {
    setMode(mode === 'day' ? 'week' : 'day');
  };

  return (
    <View style={styles.flex}>
      {/* Хедер (вне скролла): недели + ручка + дни */}
      <View style={[styles.header, styles.contentWidth]}>
        {banner}
        <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />

        <GestureDetector gesture={pan}>
          <Pressable onPress={toggle} style={styles.handle}>
            <Text style={[styles.handleHint, { color: theme.textSecondary }]}>
              {mode === 'day' ? '▼ неделя' : '▲ по дням'}
            </Text>
            <View style={[styles.handleBar, { backgroundColor: theme.textSecondary }]} />
          </Pressable>
        </GestureDetector>

        {/* Выбор дня (в режиме недели он скрыт) */}
        {mode === 'day' ? (
          week.data ? (
            <DayStrip days={weekDays} selected={anchor} onSelect={setRawAnchor} />
          ) : (
            <View style={styles.stripSkeleton} />
          )
        ) : null}
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
        ) : mode === 'day' ? (
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
    paddingBottom: 0,
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
