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
};

const SETTINGS_KEY = 'notifications.settings';
const LAST_TOKEN_KEY = 'notifications.lastToken';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  changesEnabled: true,
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

const STATUS_KEY = 'notifications.status';

export type RegistrationStatus = {
  state: 'idle' | 'registering' | 'registered' | 'error';
  message?: string;
};

export function useNotificationStatus(): RegistrationStatus {
  return useSyncExternalStore(
    (cb) => storage.subscribe(STATUS_KEY, cb),
    () => storage.get(STATUS_KEY, { state: 'idle' } as RegistrationStatus),
  );
}

function setStatus(next: RegistrationStatus) {
  storage.set(STATUS_KEY, next);
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
      if (cancelled) return;
      setStatus({ state: 'registering' });

      const permissionGranted = await ensurePermissions();
      if (cancelled) return;

      if (!permissionGranted) {
        // Разрешение отклонено — оставляем выключенным, чтобы не перепрашивать
        setStatus({ state: 'error', message: 'нет разрешения на уведомления' });
        storage.set(SETTINGS_KEY, { ...settings, enabled: false });
        return;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

        if (cancelled || typeof token !== 'string' || !token.startsWith('Expo')) {
          setStatus({
            state: 'error',
            message: 'токен не получен' + (projectId ? '' : ' (eas projectId?)'),
          });
          return;
        }

        await registerSubscription({
          expoPushToken: token,
          role: identity.role,
          buildingSlug: identity.buildingSlug,
          targetId: identity.targetId,
          targetLabel: identity.targetLabel,
          changesEnabled: settings.changesEnabled,
          tomorrowHour: null,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        });
        if (cancelled) return;

        storage.set(LAST_TOKEN_KEY, token);
        setStatus({ state: 'registered' });
      } catch (error) {
        if (cancelled) return;
        console.warn('[push] регистрация не удалась:', error);
        setStatus({ state: 'error', message: String(error).slice(0, 120) });
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
      .then(() => setStatus({ state: 'idle' }))
      .catch((error) => setStatus({ state: 'error', message: 'не удалось отключить у ' + String(error).slice(0, 80) }))
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
