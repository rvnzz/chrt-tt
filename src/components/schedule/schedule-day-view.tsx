import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useState, type ReactNode } from 'react';

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
import {
  avoidSunday,
  formatDate,
  formatRange,
  todayISO,
  weekdayFull,
  weekdayShort,
} from '@/utils/date';

type Props = {
  group: SelectedGroup;
  /** Плашка над навигацией (например, «вы смотрите … / ваша — …») */
  banner?: ReactNode;
};

type Mode = 'day' | 'week';

/**
 * Расписание группы: переключатель «День / Неделя»,
 * карточки пар со звонками, навигация по неделям (без воскресений).
 */
export function ScheduleDayView({ group, banner }: Props) {
  const [mode, setMode] = useState<Mode>('day');
  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);

  const weekDays = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(weekDays.map((day) => day.date));

  const pairs = week.data ? findGroupPairs(week.data, group, anchor) : [];
  const weekPairs = week.data ? collectGroupWeek(week.data, group) : [];
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

      {/* День / Неделя */}
      <View style={styles.modeRow}>
        <ModeChip
          label="День"
          sub={week.data ? weekdayShort(anchor) : ''}
          active={mode === 'day'}
          onPress={() => setMode('day')}
        />
        <ModeChip
          label="Неделя"
          sub={week.data ? formatRange(week.data.week_start, week.data.week_end) : ''}
          active={mode === 'week'}
          onPress={() => setMode('week')}
        />
      </View>

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

/** Чип-переключатель «День / Неделя» */
function ModeChip({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.modeChip,
          {
            borderColor: active ? theme.text : theme.textSecondary,
          },
        ]}>
        <View style={styles.modeChipText}>
          <ThemedText
            type={active ? 'smallBold' : 'small'}
            themeColor={active ? 'text' : 'textSecondary'}>
            {label}
          </ThemedText>
          {sub ? (
            <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
              {active ? sub : ''}
            </ThemedText>
          ) : null}
        </View>
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
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modeChip: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
  },
  modeChipText: {
    alignItems: 'center',
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
    marginBottom: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
