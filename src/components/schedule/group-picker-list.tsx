import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';

import { collectGroups } from '@/api/derive';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWeek } from '@/hooks/use-week';
import { todayISO } from '@/utils/date';

export type GroupOption = ReturnType<typeof collectGroups>[number];

type GroupPickerListProps = {
  selectedId?: number;
  onSelect: (group: GroupOption) => void;
};

const BUILDING_SHORT: Record<string, string> = {
  fulltime: 'Очное',
  parttime: 'Заочное',
  parttimefulltime: 'Очно-заочное',
};

export function GroupPickerList({ selectedId, onSelect }: GroupPickerListProps) {
  const theme = useTheme();
  const week = useWeek(todayISO());
  const [query, setQuery] = useState('');

  const groups = week.data ? collectGroups(week.data) : [];
  const filtered = groups.filter((group) => group.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <FlatList
      style={styles.flex}
      data={filtered}
      keyExtractor={(group) => String(group.id)}
      contentContainerStyle={styles.listContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск группы…"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
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
            title="Не удалось загрузить список групп"
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
          <Pressable onPress={() => onSelect(item)} style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type={isSelected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
              <View style={styles.rowText}>
                <ThemedText type="default" selectable>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {BUILDING_SHORT[item.building_slug] ?? item.building_name} · {item.course_number} курс
                </ThemedText>
              </View>
              {isSelected && (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  выбрана
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
