import { Stack } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { collectDays, collectGroupWeek } from '@/api/derive';
import { pairTimeMap } from '@/api/bells';
import { GroupPickerList, type GroupOption } from '@/components/schedule/group-picker-list';
import { PairCard } from '@/components/schedule/pair-card';
import { WeekNav } from '@/components/schedule/week-nav';
import { EmptyState, PairSkeleton } from '@/components/schedule/states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePreviewGroup } from '@/hooks/use-preview-group';
import { useBellMap } from '@/hooks/use-bells';
import { useWeek } from '@/hooks/use-week';
import { avoidSunday, formatDate, todayISO, weekdayFull } from '@/utils/date';
import { HeadTitle } from '@/components/head-title';

/** Таб «Просмотр»: недельное расписание другой группы (без дневного режима). */
export default function PeekScreen() {
  const [preview, setPreview] = usePreviewGroup();
  const [showPicker, setShowPicker] = useState(false);

  const [rawAnchor, setRawAnchor] = useState(todayISO());
  const anchor = avoidSunday(rawAnchor);
  const week = useWeek(anchor);

  const days = week.data ? collectDays(week.data) : [];
  const bellMap = useBellMap(days.map((day) => day.date));
  const weekPairs = week.data && preview ? collectGroupWeek(week.data, preview) : [];
        <HeadTitle title={ preview ? `Расписание ЧРТ — ${preview.name}` : 'Группы — Расписание ЧРТ' }/>

  function pick(group: GroupOption) {
    setPreview(group);
    setShowPicker(false);
  }

  if (showPicker || !preview) {
    return (
      <ThemedView style={styles.flex}>
        <Stack.Screen options={{ title: 'Просмотр группы' }} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.pickHint}>
          Выберите группу — её расписание покажется здесь на всю неделю.
        </ThemedText>
        <GroupPickerList
          selectedId={preview?.id}
          onSelect={(group) => {
            pick(group);
            setPreview(group);
            setShowPicker(false);
          }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: preview.name }} />

      {/* Хедер: сменить группу + навигация недель */}
      <View style={[styles.contentWidth, styles.header]}>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [pressed && styles.pressed, styles.changeButton]}>
          <ThemedText type="smallBold">Сменить группу</ThemedText>
        </Pressable>

        <WeekNav date={rawAnchor} onChange={setRawAnchor} week={week.data} />
      </View>

      {/* Неделя по дням */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, styles.contentWidth]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={week.isFetching && week.data != null} onRefresh={() => week.refetch()} />
        }>
        {week.isLoading ? (
          <>
            <PairSkeleton />
            <PairSkeleton />
            <PairSkeleton />
          </>
        ) : week.isError ? (
          <EmptyState
            emoji="📡"
            title="Не удалось загрузить расписание"
            description="Проверьте подключение к сети и попробуйте снова."
            actionLabel="Повторить"
            onAction={() => week.refetch()}
          />
        ) : (
          weekPairs.map((day) => (
            <View key={day.date} style={styles.weekSection}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.dayHeader}>
                {weekdayFull(day.date)}, {formatDate(day.date)}
              </ThemedText>
              <View style={styles.list}>
                {day.pairs.length > 0 ? (
                  day.pairs.map((pair) => (
                    <PairCard
                      key={pair.number}
                      pair={pair}
                      time={pairTimeMap(bellMap.get(day.date)).get(pair.number)}
                    />
                  ))
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Занятий нет
                  </ThemedText>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
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
  header: {
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: Spacing.two,
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  pickHint: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + Spacing.one,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  weekSection: {
    gap: Spacing.two,
  },
  dayHeader: {
    marginLeft: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});