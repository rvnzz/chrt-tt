import { Pressable, StyleSheet, View } from 'react-native';

import { AllWeekData } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, formatRange } from '@/utils/date';

type WeekNavProps = {
  /** Любая дата текущей недели */
  date: string;
  onChange: (nextDate: string) => void;
  /** Данные текущей недели (для подписи диапазона) */
  week?: AllWeekData | null;
};

/** Переключение недель ‹ › + подпись диапазона */
export function WeekNav({ date, onChange, week }: WeekNavProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onChange(addDaysISO(date, -7))} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedText type="subtitle" style={[styles.arrow, { color: theme.text }]}>
          ‹
        </ThemedText>
      </Pressable>

      <ThemedText type="smallBold" themeColor="textSecondary">
        {week ? formatRange(week.week_start, week.week_end) : '…'}
      </ThemedText>

      <Pressable onPress={() => onChange(addDaysISO(date, 7))} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedText type="subtitle" style={[styles.arrow, { color: theme.text }]}>
          ›
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    lineHeight: 36,
    fontSize: 24,
    paddingHorizontal: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
