import { AllWeekData } from '@/api/types';

const API_BASE = process.env.EXPO_PUBLIC_TIMET_API_URL ?? 'https://timet.eremin.tech';

/**
 * Загружает недельное расписание по всем корпусам.
 * `date` может быть любым днём недели — сервер вернёт всю неделю (Пн–Вс).
 */
export async function fetchAllWeek(date: string, signal?: AbortSignal): Promise<AllWeekData> {
  const response = await fetch(`${API_BASE}/embed/all/week/data?date=${date}`, { signal });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить расписание (${response.status})`);
  }

  return (await response.json()) as AllWeekData;
}
