import { StyleSheet, View } from 'react-native';

import { Lesson, Pair } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type PairCardProps = {
  pair: Pair;
  /** Время звонков для номера пары (с сервера, может отсутствовать) */
  time?: { start: string; end: string };
};

export function PairCard({ pair, time }: PairCardProps) {
  const lessons = pair.lessons.filter((lesson) => lesson.subject.trim().length > 0);

  if (lessons.length === 0) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.numberBadge}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.numberText}>
          {pair.number}
        </ThemedText>
        {time && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.timeText}>
            {time.start}
          </ThemedText>
        )}
      </View>

      <View style={styles.content}>
        {lessons.map((lesson, index) => (
          <LessonRow key={`${lesson.subgroup}-${lesson.subject}-${index}`} lesson={lesson} split={pair.is_split} />
        ))}
      </View>
    </ThemedView>
  );
}

/** Строка внутри пары: обычная или для подгруппы сплит-пары */
function LessonRow({ lesson, split }: { lesson: Lesson; split: boolean }) {
  return (
    <View style={styles.lessonRow}>
      {split && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subgroupLabel}>
          {lesson.subgroup ?? '1'} подгр.
        </ThemedText>
      )}

      <View style={styles.lessonContent}>
        <ThemedText type="default" selectable style={styles.subject}>
          {lesson.subject}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" selectable style={styles.meta} numberOfLines={1}>
          {lesson.teacher} · ауд. {lesson.room}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  numberBadge: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontVariant: ['tabular-nums'],
  },
  timeText: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
    gap: Spacing.three,
  },
  lessonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'baseline',
  },
  subgroupLabel: {
    minWidth: 56,
  },
  lessonContent: {
    flex: 1,
    gap: 2,
  },
  subject: {
    flexShrink: 1,
  },
  meta: {},
});
