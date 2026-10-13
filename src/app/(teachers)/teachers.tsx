import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

import { collectTeachers, TeacherRef } from '@/api/derive';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWeek } from '@/hooks/use-week';
import { todayISO } from '@/utils/date';

export default function TeachersScreen() {
  const theme = useTheme();
  const week = useWeek(todayISO());
  const [query, setQuery] = useState('');

  const teachers = useMemo(() => (week.data ? collectTeachers(week.data) : []), [week.data]);
  const filtered = teachers.filter((teacher) => teacher.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <ThemedView style={styles.flex}>
      <FlatList
        data={filtered}
        keyExtractor={(teacher) => String(teacher.id)}
        contentContainerStyle={[styles.listContent, styles.contentWidth]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск преподавателя…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
        }
        ListEmptyComponent={
          week.isLoading ? (
            <View style={styles.list}>
              <PairSkeleton />
              <PairSkeleton />
            </View>
          ) : week.isError ? (
            <EmptyState
              emoji="📡"
              title="Не удалось загрузить список преподавателей"
              actionLabel="Повторить"
              onAction={() => week.refetch()}
            />
          ) : (
            <EmptyState emoji="🔍" title="Ничего не найдено" description="Попробуйте изменить запрос." />
          )
        }
        renderItem={({ item }) => <TeacherRow teacher={item} />}
      />
    </ThemedView>
  );
}

function TeacherRow({ teacher }: { teacher: TeacherRef }) {
  return (
    <Link href={{ pathname: '/t/[id]', params: { id: teacher.id, name: teacher.name } }} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.row}>
          <ThemedText type="default" selectable>
            {teacher.name}
          </ThemedText>
          {teacher.buildings.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {teacher.buildings.join(' · ')}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>
    </Link>
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
  listContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  search: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
    marginBottom: Spacing.one,
  },
  row: {
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
