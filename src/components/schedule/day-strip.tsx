import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayNumber, todayISO, weekdayShort } from '@/utils/date';
import { DayRef } from '@/api/types';

type DayStripProps = {
  days: DayRef[];
  selected: string;
  onSelect: (date: string) => void;
};

export function DayStrip({ days, selected, onSelect }: DayStripProps) {
  const theme = useTheme();
  const today = todayISO();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {days.map((day) => {
          const isSelected = day.date === selected;
          const isToday = day.date === today;

          return (
            <Pressable
              key={day.date}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
                onSelect(day.date);
              }}
              style={({ pressed }) => [
                styles.chip,
                isSelected && { backgroundColor: theme.backgroundSelected },
                pressed && { opacity: 0.7 },
              ]}>
              <ThemedText
                type="small"
                themeColor={isSelected ? 'text' : 'textSecondary'}
                style={styles.chipWeekday}>
                {weekdayShort(day.date)}
              </ThemedText>
              <ThemedText
                type="smallBold"
                themeColor={isSelected ? 'text' : 'textSecondary'}
                style={styles.chipNumber}>
                {dayNumber(day.date)}
              </ThemedText>

              {/* Точка: пустой день / «сегодня» */}
              <View style={styles.dotRow}>
                {!day.hasSchedule ? (
                  <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
                ) : (
                  isToday && <View style={[styles.dot, { backgroundColor: theme.text }]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderCurve: 'continuous',
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.two,
    gap: Spacing.one,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    minWidth: 52,
  },
  chipWeekday: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipNumber: {
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
