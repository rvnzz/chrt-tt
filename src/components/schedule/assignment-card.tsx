import { StyleSheet, View } from 'react-native';

import { Assignment } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type AssignmentCardProps = {
  assignment: Assignment;
  /** В разрезе кабинета показываем преподавателя, в разрезе преподавателя — кабинет (не дублируем заголовок) */
  mode?: 'teacher' | 'room';
};

/** Карточка пары в разрезе преподавателя/аудитории */
export function AssignmentCard({ assignment, mode = 'teacher' }: AssignmentCardProps) {
  const suffix =
    mode === 'room'
      ? assignment.teacher // в кабинете кабинет уже в заголовке
      : `ауд. ${assignment.room}`; // у преподавателя кабинет в заголовке отсутствует

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.pairNumber}>
        {assignment.pair_number}
      </ThemedText>

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
  pairNumber: {
    width: 20,
    fontVariant: ['tabular-nums'],
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
});
