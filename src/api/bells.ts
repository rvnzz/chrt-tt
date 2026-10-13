/** Расписание звонков c сервера: GET /api/bells?date=YYYY-MM-DD */
import { PUSH_API_URL } from '@/api/settings';

export type BellItem = {
  type: 'pair' | 'break';
  pair: number | null;
  start: string;
  end: string;
  label: string | null;
};

export type BellSchedule = {
  name: string;
  kind: string;
  source: 'override' | 'default';
  items: BellItem[];
};

export async function fetchBellSchedule(date: string, signal?: AbortSignal): Promise<BellSchedule> {
  const response = await fetch(`${PUSH_API_URL}/api/bells?date=${date}`, { signal });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить звонки (${response.status})`);
  }

  const data = (await response.json()) as { schedule: BellSchedule };
  return data.schedule;
}

/** Карта «номер пары → { start, end }» из шаблона звонков */
export function pairTimeMap(bell: BellSchedule | undefined): Map<number, { start: string; end: string }> {
  const map = new Map<number, { start: string; end: string }>();

  if (!bell) return map;

  for (const item of bell.items) {
    if (item.type === 'pair' && item.pair != null) {
      map.set(item.pair, { start: item.start, end: item.end });
    }
  }

  return map;
}
