import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

import { collectTeachers } from '@/api/derive';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWeek } from '@/hooks/use-week';
import { todayISO } from '@/utils/date';

export type PickedTeacher = {
  id: number;
  name: string;
};

type TeacherPickerListProps = {
  onSelect: (teacher: PickedTeacher) => void;
  selectedId?: number;
};

export function TeacherPickerList({ onSelect, selectedId }: TeacherPickerListProps) {
  const theme = useTheme();
  const week = useWeek(todayISO());
  const [query, setQuery] = useState('');

  const teachers = useMemo(() => (week.data ? collectTeachers(week.data) : []), [week.data]);
  const filtered = teachers.filter((teacher) => teacher.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <FlatList
      style={styles.flex}
      data={filtered}
      keyExtractor={(teacher) => String(teacher.id)}
      contentContainerStyle={styles.listContent}
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
      renderItem={({ item }) => {
        const isSelected = selectedId === item.id;

        return (
          <Pressable
            onPress={() => onSelect({ id: item.id, name: item.name })}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type={isSelected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
              <View style={styles.rowText}>
                <ThemedText type="default" selectable>
                  {item.name}
                </ThemedText>
                {item.buildings.length > 0 && (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {item.buildings.join(' · ')}
                  </ThemedText>
                )}
              </View>
              {isSelected && (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  выбран
                </ThemedText>
              )}
            </ThemedView>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  },
  row: {
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  rowText: {
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
