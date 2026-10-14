import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useMemo } from 'react';
import { runOnJS } from 'react-native-reanimated';

import { DayRef } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { avoidSunday, dayNumber, todayISO, weekdayShort } from '@/utils/date';

export type WeekOption = {
  monday: string;
  label: string;
  active: boolean;
};

type DayStripProps = {
  /** Полоса дней (режим «день») */
  days?: DayRef[];
  selected: string;
  onSelect?: (date: string) => void;
  /** Полоса недель (режим «неделя») — слайдер недель */
  weeks?: WeekOption[];
  onWeekSelect?: (monday: string) => void;
  /** Горизонтальный свайп по полосе — переключить день/неделю */
  onSwipe?: () => void;
};

/** Слайдер-полоса: дни (режим дня) или недели (режим недели); свайп переключает режим. */
export function DayStrip({
  days,
  selected,
  onSelect,
  weeks,
  onWeekSelect,
  onSwipe,
}: DayStripProps) {
  const theme = useTheme();
  const today = todayISO();
  const variant = weeks ? 'weeks' : 'days';

  const onSwipeSafe = useCallback(() => {
    onSwipe?.();
  }, [onSwipe]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-60, 60]) // только явный горизонтальный свайп
        .failOffsetY([-24, 24]) // вертикальное движение — отдать скроллу списка
        .onEnd((event: { translationX: number }) => {
          'worklet';
          if (Math.abs(event.translationX) > 60) {
            runOnJS(onSwipeSafe)();
          }
        }),
    [onSwipeSafe],
  );

  return (
    <GestureDetector gesture={pan}>
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.rowContent}>
          {variant === 'days'
            ? days?.map((day) => (
                <DayChip
                  key={day.date}
                  date={day.date}
                  hasSchedule={day.hasSchedule}
                  isSelected={day.date === selected}
                  isToday={day.date === today}
                  onPress={() => {
                    if (process.env.EXPO_OS === 'ios') {
                      void Haptics.selectionAsync();
                    }
                    onSelect?.(day.date);
                  }}
                  theme={theme}
                />
              ))
            : weeks?.map((week) => (
                <WeekChip
                  key={week.monday}
                  week={week}
                  onPress={() => {
                    if (process.env.EXPO_OS === 'ios') {
                      void Haptics.selectionAsync();
                    }
                    onWeekSelect?.(week.monday);
                  }}
                  theme={theme}
                />
              ))}
        </View>
      </ThemedView>
    </GestureDetector>
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
        {dayNumber(date)}
      </ThemedText>

      {/* Точка: пустой день / «сегодня» */}
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

type WeekChipProps = {
  week: WeekOption;
  onPress: () => void;
  theme: Record<string, string>;
};

function WeekChip({ week, onPress, theme }: WeekChipProps) {
  const [start, end] = week.label.split('–');
  const isCurrent = week.active;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isCurrent && { backgroundColor: theme.backgroundSelected },
        pressed && { opacity: 0.7 },
      ]}>
      <ThemedText
        type="small"
        themeColor={isCurrent ? 'text' : 'textSecondary'}
        style={styles.chipWeekday}>
        {start}
      </ThemedText>
      <ThemedText
        type="smallBold"
        themeColor={isCurrent ? 'text' : 'textSecondary'}
        style={styles.chipNumber}>
        {end}
      </ThemedText>
    </Pressable>
  );
}

/** Хелпер: убедиться, что monday не воскресенье (не случится, но на всякий случай) */
export function normalizeMonday(iso: string): string {
  return avoidSunday(iso);
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderCurve: 'continuous',
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
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
});
