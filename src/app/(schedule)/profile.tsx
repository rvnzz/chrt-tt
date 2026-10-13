import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { PUSH_SUPPORTED, useNotificationSettings, useNotificationStatus } from '@/hooks/use-push';
import type { RegistrationStatus } from '@/hooks/use-push';
import { useOta } from '@/hooks/use-ota';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { useMyTeacher, useUserRole } from '@/hooks/use-user';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [role, setRole] = useUserRole();
  const [group] = useSelectedGroup();
  const [myTeacher] = useMyTeacher();
  const [notifications, setNotifications] = useNotificationSettings();
  const notificationStatus = useNotificationStatus();
  const ota = useOta();

  /** Смена роли: если для новой роли нет данных — сразу к выбору */
  function pickRole(next: 'student' | 'teacher') {
    if (role === next) return;

    setRole(next);
    if (next === 'student' && !group) router.push('/groups');
    if (next === 'teacher' && !myTeacher) router.push('/pick-teacher');
  }

  const roleSubtitle = (next: 'student' | 'teacher') => {
    if (next === 'student') return group ? `Группа ${group.name}` : 'Группа ещё не выбрана';
    return myTeacher ? myTeacher.name : 'Вы ещё не выбрали себя';
  };

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: 'Профиль' }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic">
        {/* Роль */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            РОЛЬ
          </ThemedText>

          <Row
            emoji="🎓"
            title="Я студент"
            subtitle={roleSubtitle('student')}
            selected={role === 'student'}
            onPress={() => pickRole('student')}
          />
          <Row
            emoji="👩‍🏫"
            title="Я преподаватель"
            subtitle={roleSubtitle('teacher')}
            selected={role === 'teacher'}
            onPress={() => pickRole('teacher')}
          />
        </View>

        {/* Смена данных роли */}
        {role === 'student' ? (
          <Row
            title="Сменить группу"
            subtitle={group?.name}
            chevron
            onPress={() => router.push('/groups')}
          />
        ) : (
          <Row
            title="Выбрать себя"
            subtitle={myTeacher?.name}
            chevron
            onPress={() => router.push('/pick-teacher')}
          />
        )}

        {/* Уведомления */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            УВЕДОМЛЕНИЯ
          </ThemedText>

          {!PUSH_SUPPORTED ? (
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                Пуши работают в приложении (dev-сборка через EAS). В Expo Go и на web они
                недоступны.
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedView
                type={notifications.enabled ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.row}>
                <View style={styles.rowText}>
                  <ThemedText type="default">Уведомления</ThemedText>
                  <ThemedText type="small" themeColor={notificationStatus.state === 'error' ? 'textSecondary' : 'textSecondary'}>
                    {statusText(notificationStatus, notifications.enabled)}
                  </ThemedText>
                </View>
                <Switch
                  value={notifications.enabled}
                  onValueChange={(value) => setNotifications({ ...notifications, enabled: value })}
                />
              </ThemedView>

              {notifications.enabled && (
                <>
                  <ThemedView type="backgroundElement" style={styles.row}>
                    <View style={styles.rowText}>
                      <ThemedText type="default">Изменения расписания</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Сразу при изменении пар
                      </ThemedText>
                    </View>
                    <Switch
                      value={notifications.changesEnabled}
                      onValueChange={(value) =>
                        setNotifications({ ...notifications, changesEnabled: value })
                      }
                    />
                  </ThemedView>

                  <ThemedView type="backgroundElement" style={styles.row}>
                    <View style={styles.rowText}>
                      <ThemedText type="default">Расписание на завтра</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {notifications.tomorrowHour == null
                          ? 'Выключено — выберите час'
                          : `Каждый день в ${notifications.tomorrowHour}:00`}
                      </ThemedText>
                    </View>
                  </ThemedView>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourRow}>
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                      <Pressable
                        key={hour}
                        onPress={() =>
                          setNotifications({
                            ...notifications,
                            tomorrowHour: notifications.tomorrowHour === hour ? null : hour,
                          })
                        }
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView
                          type={notifications.tomorrowHour === hour ? 'backgroundSelected' : 'backgroundElement'}
                          style={styles.hourChip}>
                          <ThemedText type="small" themeColor="textSecondary">
                            {hour}:00
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}
            </>
          )}
        </View>

        {/* OTA-обновление JS-кода */}
        {ota.status !== 'unavailable' && (
          <Row
            title={
              ota.status === 'ready'
                ? 'Доступно обновление'
                : ota.status === 'checking' || ota.status === 'downloading'
                  ? 'Проверка обновлений…'
                  : 'Обновить приложение'
            }
            subtitle={
              ota.status === 'ready'
                ? 'Нажмите, чтобы перезапустить с новой версией'
                : undefined
            }
            chevron={ota.status === 'ready'}
            onPress={() => {
              if (ota.status === 'ready') {
                ota.restart();
                return;
              }
              ota.check();
            }}
          />
        )}

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Роль можно менять в любой момент — предыдущий выбор сохранится.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function statusText(status: RegistrationStatus, enabled: boolean): string {
  if (!enabled) return 'Выключено';

  switch (status.state) {
    case 'registering':
      return 'Регистрация…';
    case 'registered':
      return 'Подписаны';
    case 'error':
      return `Ошибка: ${status.message ?? '—'}`;
    default:
      return 'Подключение…';
  }
}

function Row({  emoji,
  title,
  subtitle,
  selected,
  chevron,
  onPress,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  chevron?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
        {emoji && <ThemedText type="title" style={styles.rowEmoji}>{emoji}</ThemedText>}
        <View style={styles.rowText}>
          <ThemedText type="default">{title}</ThemedText>
          {subtitle && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          )}
        </View>
        {selected ? (
          <ThemedText type="smallBold" themeColor="textSecondary">
            выбрано
          </ThemedText>
        ) : (
          chevron && (
            <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
              ›
            </ThemedText>
          )
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginLeft: Spacing.two,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  hourRow: {
    marginHorizontal: Spacing.half,
  },
  hourChip: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    marginRight: Spacing.two,
  },
  hint: {
    marginHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
