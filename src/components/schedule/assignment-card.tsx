import { StyleSheet, View } from 'react-native';

import { Assignment } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type AssignmentCardProps = {
  assignment: Assignment;
  /** В разрезе кабинета показываем преподавателя, в разрезе преподователя — кабинет (не дублируем заголовок) */
  mode?: 'teacher' | 'room';
  /** Время звонков для номера пары (с сервера, может отсутствовать) */
  time?: { start: string; end: string };
};

/** Карточка пары в разрезе преподавателя/аудитории */
export function AssignmentCard({ assignment, mode = 'teacher', time }: AssignmentCardProps) {
  const suffix =
    mode === 'room'
      ? assignment.teacher // в кабинете кабинет уже в заголовке
      : `ауд. ${assignment.room}`; // у преподавателя кабинет в заголовке отсутствует

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.numberCol}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.pairNumber}>
          {assignment.pair_number}
        </ThemedText>
        {time && (
          <View style={styles.timeCol}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timeText}>
              {time.start}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timeText}>
              {time.end}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <ThemedText type="default" selectable>
          {assignment.subject}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" selectable numberOfLines={1}>
          {assignment.group_name}
          {assignment.subgroup ? ` (${assignment.subgroup} подгр.)` : ''} · {suffix}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderCurve: 'continuous',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  numberCol: {
    width: 40,
    alignItems: 'center',
  },
  pairNumber: {
    fontVariant: ['tabular-nums'],
  },
  timeCol: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    lineHeight: 13,
    fontVariant: ['tabular-nums'],
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
});
