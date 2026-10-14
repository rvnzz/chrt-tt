import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { GroupOption, GroupPickerList } from '@/components/schedule/group-picker-list';
import { ScheduleDayView } from '@/components/schedule/schedule-day-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { usePreviewGroup } from '@/hooks/use-preview-group';
import { useSelectedGroup } from '@/hooks/use-selected-group';

export default function PeekScreen() {  const router = useRouter();
  const [preview, setPreview] = usePreviewGroup();
  const [ownGroup] = useSelectedGroup();
  const [showPicker, setShowPicker] = useState(false);

  function pick(group: GroupOption) {
    setPreview(group);
    setShowPicker(false);
    router.dismiss();
  }

  const banner = preview && (
    <ThemedView type="backgroundElement" style={styles.banner}>
      <View style={styles.bannerText}>
        <ThemedText type="small" selectable>
          Вы смотрите {preview.name}
          {ownGroup ? ` (ваша — ${ownGroup.name})` : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Уведомления по-прежнему приходят на вашу группу
        </ThemedText>
      </View>
      {ownGroup && (
        <Pressable
          onPress={() => setPreview(null)}
          hitSlop={6}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold">Сброс</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: 'Просмотр группы' }} />

      {preview && !showPicker ? (
        <>
          <View style={[styles.topBar, styles.contentWidth]}>
            <Pressable onPress={() => setShowPicker(true)}
              style={({ pressed }) => [pressed && styles.pressed, styles.changeButton]}>
              <ThemedText type="smallBold">Сменить группу</ThemedText>
            </Pressable>
          </View>
          <ScheduleDayView group={preview} weekOnly banner={banner} />
        </>
      ) : (
        <ThemedView style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.pickHint}>
            Выберите группу — расписание откроется здесь, ваша группа и уведомления не изменятся.
          </ThemedText>
          <GroupPickerList selectedId={preview?.id} onSelect={pick} />
        </ThemedView>
      )}
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
  topBar: {
    padding: Spacing.two,
    paddingBottom: 0,
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  bannerText: {
    flex: 1,
  },
  pickHint: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
