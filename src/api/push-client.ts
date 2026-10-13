import { PUSH_API_URL } from '@/api/settings';

/** Регистрация подписки пуш-уведомлений на сервере */
export async function registerSubscription(payload: {
  expoPushToken: string;
  role: 'student' | 'teacher';
  buildingSlug: string;
  targetId: number;
  targetLabel: string;
  changesEnabled: boolean;
  tomorrowHour: number | null;
  tzOffsetMinutes: number;
}): Promise<void> {
  const response = await fetch(`${PUSH_API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Не удалось зарегистрировать подписку (${response.status})`);
  }
}

/** Снятие подписки (выключение уведомлений / выход) */
export async function unregisterSubscription(expoPushToken: string): Promise<void> {
  const response = await fetch(`${PUSH_API_URL}/unregister`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expoPushToken }),
  });

  if (!response.ok) {
    throw new Error(`Не удалось отключить подписку (${response.status})`);
  }
}
