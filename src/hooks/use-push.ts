import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useSyncExternalStore } from 'react';

import { registerSubscription, unregisterSubscription } from '@/api/push-client';
import { useMyTeacher, useUserRole } from '@/hooks/use-user';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { storage } from '@/utils/storage';

/**
 * Пуш-уведомления:
 * - настройки хранятся локально и на сервере (`server/` этого репо);
 * - регистрация автоматически синхронизируется с ролью/группой/преподавателем;
 * - в Expo Go на Android пуши технически не работают — фича предлагается только
 *   в dev/прод-сборках.
 */

export const PUSH_SUPPORTED =
  process.env.EXPO_OS !== 'web' &&
  Device.isDevice &&
  // Пуш не работает в Expo Go на Android — только dev/прод-сборки и standalone
  Constants.appOwnership !== 'expo';

export type NotificationSettings = {
  /** Мастер-выключатель */
  enabled: boolean;
  /** Пуш «изменение расписания» */
  changesEnabled: boolean;
  /** Час напоминания «расписание на завтра» (локальное время устройства), null — выключено */
  tomorrowHour: number | null;
};

const SETTINGS_KEY = 'notifications.settings';
const LAST_TOKEN_KEY = 'notifications.lastToken';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  changesEnabled: true,
  tomorrowHour: null,
};

export function useNotificationSettings(): [
  NotificationSettings,
  (next: NotificationSettings) => void,
] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(SETTINGS_KEY, cb),
    () => storage.get(SETTINGS_KEY, DEFAULT_SETTINGS),
  );

  return [value, (next) => storage.set(SETTINGS_KEY, next)];
}

type Identity = {
  role: 'student' | 'teacher';
  buildingSlug: string;
  targetId: number;
  targetLabel: string;
};

function buildIdentity(
  role: string | null,
  group: ReturnType<typeof useSelectedGroup>[0],
  myTeacher: ReturnType<typeof useMyTeacher>[0],
): Identity | null {
  if (role === 'student' && group) {
    return {
      role: 'student',
      buildingSlug: group.building_slug,
      targetId: group.id,
      targetLabel: group.name,
    };
  }

  if (role === 'teacher' && myTeacher) {
    return {
      role: 'teacher',
      // преподаватели работают в нескольких корпусах — знак «любой корпус»
      buildingSlug: '*',
      targetId: myTeacher.id,
      targetLabel: myTeacher.name,
    };
  }

  return null;
}

/**
 * Синхронизирует регистрацию на сервере с настройками и профилем.
 * Подлючить один раз из корневого layout.
 */
export function usePushSync(): void {
  const [role] = useUserRole();
  const [group] = useSelectedGroup();
  const [myTeacher] = useMyTeacher();
  const [settings] = useNotificationSettings();

  // Регистрация / перерегистрация (роль, группа, настройки)
  useEffect(() => {
    if (!PUSH_SUPPORTED || !settings.enabled) return;

    const identity = buildIdentity(role, group, myTeacher);
    if (!identity) return;

    let cancelled = false;

    (async () => {
      const permission = await ensurePermissions();
      if (cancelled) return;

      if (!permission) {
        // Разрешение отклонено — оставляем выключенным, чтобы не перепрашивать
        storage.set(SETTINGS_KEY, { ...settings, enabled: false });
        return;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (cancelled || typeof token !== 'string' || !token.startsWith('Expo')) return;

      try {
        await registerSubscription({
          expoPushToken: token,
          role: identity.role,
          buildingSlug: identity.buildingSlug,
          targetId: identity.targetId,
          targetLabel: identity.targetLabel,
          changesEnabled: settings.changesEnabled,
          tomorrowHour: settings.tomorrowHour,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        });
        storage.set(LAST_TOKEN_KEY, token);
      } catch (error) {
        console.warn('[push] регистрация не удалась:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role, group, myTeacher, settings]);

  // Выключение → разрегистрация
  useEffect(() => {
    if (!PUSH_SUPPORTED || settings.enabled) return;

    const token = storage.get<string | null>(LAST_TOKEN_KEY, null);
    if (!token) return;

    unregisterSubscription(token)
      .catch(() => undefined)
      .finally(() => storage.remove(LAST_TOKEN_KEY));
  }, [settings.enabled]);
}

/** Разрешение на уведомления; true — granted */
async function ensurePermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

/** Постоянный обработчик уведомлений (banner в foreground) */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
