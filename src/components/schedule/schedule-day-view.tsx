import * as Haptics from 'expo-haptics';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Gesture,
  GestureDetector,
  Pressable,
} from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { collectDays, collectGroupWeek, collectTeacherWeek, findGroupPairs } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { AssignmentCard } from '@/components/schedule/assignment-card';
import { PairCard } from '@/components/schedule/pair-card';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SelectedGroup } from '@/hooks/use-selected-group';
import { useTheme } from '@/hooks/use-theme';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, formatDate, todayISO, weekdayFull, weekdayIndex, weekdayShort } from '@/utils/date';
import { WeekNav } from '@/components/schedule/week-nav';

type Props = {
  group?: SelectedGroup;
  teacherId?: number;
  banner?: ReactNode;
  /** Только недельный режим (таб «Просмотр»): без свайпа и чипов */
  weekOnly?: boolean;
};

type Mode = 'day' | 'week';

/** Мост для worklet: runOnJS вызывает его, он зовёт актуальный onPanEnd (обновляется при рендере) */
let latestPanEnd: ((translationX: number) => void) | null = null;

function dispatchPanEnd(translationX: number) {
  latestPanEnd?.(translationX);
}

/**
 * Расписание группы или преподавателя с полосой-слайдером:
 *   «день»  — чипы Пн–Сб;
 *   «неделя»— ‹ даты недели ›.
 * Горизонтальный свайп по полосе переключает состояния с анимацией.
 */
export function ScheduleDayView({ group, teacherId, banner, weekOnly = false }: Props) {
  const [mode, setMode] = useState<Mode>(weekOnly ? 'week' : 'day');
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);
  const theme = useTheme();

  const days = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(days.map((day) => day.date));

  const groupPairs = week.data && group ? findGroupPairs(week.data, group, anchor) : [];
  const groupWeek = week.data && group ? collectGroupWeek(week.data, group) : [];

  const teacherDays = useMemo(
    () =>
      week.data && teacherId
        ? collectTeacherWeek(week.data, teacherId).filter(
            (day) => weekdayIndex(day.date) !== 6,
          )
        : [],
    [week.data, teacherId],
  );

  const teacherDayItems = teacherDays.find((day) => day.date === anchor)?.items ?? [];

  const selectedDay = week.data?.days.find((day) => day.date === anchor);
  const isTeacher = !!teacherId;

  const toggleMode = useCallback(() => {
    if (!weekOnly) {
      setMode((current) => (current === 'day' ? 'week' : 'day'));
    }
  }, [weekOnly]);

  function onPanEnd(translationX: number) {
    if (Math.abs(translationX) < 60) return;
    if (weekOnly) return;
    toggleMode();
  }

  useEffect(() => {
    latestPanEnd = onPanEnd;
  });

  const pan = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-60, 60])
      .failOffsetY([-24, 24])
      .onEnd((event: { translationX: number }) => {
        'worklet';
        runOnJS(dispatchPanEnd)(event.translationX);
      });
  }, []);

  return (
    <View style={styles.flex}>
      {banner ? <View style={[styles.contentWidth, styles.bannerWrap]}>{banner}</View> : null}

      {/* Полоса-слайдер: фиксированная высота, внутри всегда навигация недель,
          чипы дней видны только в состоянии «день» */}
      <GestureDetector gesture={pan ?? PAN_DISABLED}>
        <ThemedView type="backgroundElement" style={[styles.container, styles.contentWidth]}>
          <Animated.View
            key="week-nav"
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={styles.weekNavRow}>
            <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />
          </Animated.View>

          {mode === 'day' && !weekOnly && (
            <Animated.View
              key="days"
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(120)}
              style={styles.rowContent}>
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
            </Animated.View>
          )}
        </ThemedView>
      </GestureDetector>

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
              ) : groupPairs.length > 0 ? (
                groupPairs.map((pair) => (
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
                {day.items.length > 0 ? (
                  day.items.map((assignment, index) => (
                    <AssignmentCard
                      key={`${assignment.pair_number}-${index}`}
                      assignment={assignment}
                      time={pairTimeMap(bellMap.get(day.date)).get(assignment.pair_number)}
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
        ) : (
          groupWeek.map((day) => (
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

/** Жест-заглушка: отключён (weekOnly) */
const PAN_DISABLED = Gesture.Pan().enabled(false);

/** Чип дня */
function DayChip({ date, hasSchedule, isSelected, isToday, onPress, theme }: DayChipProps) {
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

type DayChipProps = {
  date: string;
  hasSchedule: boolean;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  theme: Record<string, string>;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentWidth: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  bannerWrap: {
    padding: Spacing.three,
    paddingBottom: 0,
  },
  container: {
    margin: Spacing.three,
    marginTop: Spacing.two,
    height: 116, // фиксированная высота в обоих состояниях
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    gap: Spacing.one,
  },
  chip: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
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
    marginTop: 2,
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
