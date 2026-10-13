import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useOta } from '@/hooks/use-ota';
import { useTheme } from '@/hooks/use-theme';

/** Плавающая плашка при запуске: «Доступно обновление — установить». */
export function OtaBanner() {
  const ota = useOta();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);

  // Проверка запускается хуком при монтировании корневого layout'а

  if (ota.status !== 'ready' || dismissed) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + Spacing.two }]}>
      <ThemedView type="backgroundElement" style={styles.banner}>
        <View style={styles.textBlock}>
          <ThemedText type="smallBold" selectable>
            Доступно обновление
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Перезапустить с новой версией
          </ThemedText>
        </View>

        <Pressable onPress={() => ota.restart()} hitSlop={6}
          style={({ pressed }) => [pressed && styles.pressed, styles.action]}>
          <View style={[styles.actionButton, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">Обновить</ThemedText>
          </View>
        </Pressable>

        <Pressable onPress={() => setDismissed(true)} hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ×
          </ThemedText>
        </Pressable>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 14,
    borderCurve: 'continuous',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
  },
  textBlock: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  pressed: {
    opacity: 0.6,
  },
});
