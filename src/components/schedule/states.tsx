import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji = '🗓️', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{emoji}</ThemedText>
      <ThemedText type="default" style={styles.title}>
        {title}
      </ThemedText>
      {description && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && <ActionButton label={actionLabel} onPress={onAction} />}
    </ThemedView>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
};

export function ActionButton({ label, onPress }: ActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
      <View style={[styles.buttonInner, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </View>
    </Pressable>
  );
}

/** Плашка «не удалось обновить, показываем сохранённое» */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ThemedView type="backgroundElement" style={styles.errorCard}>
      <ThemedText type="small" selectable>
        {message}
      </ThemedText>
      {onRetry && (
        <Pressable onPress={onRetry} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <ThemedText type="smallBold">Повторить</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

/** Скелетон карточки пары, пока идёт первая загрузка */
export function PairSkeleton() {
  const theme = useTheme();

  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonBadge, { backgroundColor: theme.backgroundSelected }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonSubject, { backgroundColor: theme.backgroundSelected }]} />
        <View style={[styles.skeletonMeta, { backgroundColor: theme.backgroundSelected }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  title: {
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    marginHorizontal: Spacing.four,
  },
  button: {
    marginTop: Spacing.three,
  },
  buttonInner: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: Spacing.two,
    marginHorizontal: Spacing.two,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginHorizontal: Spacing.one,
  },
  skeletonBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  skeletonContent: {
    flex: 1,
    gap: Spacing.two,
  },
  skeletonSubject: {
    height: 16,
    borderRadius: 8,
    width: '80%',
  },
  skeletonMeta: {
    height: 12,
    borderRadius: 6,
    width: '40%',
  },
});
