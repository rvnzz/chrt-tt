import { storage } from '@/utils/storage';
import { PUSH_API_URL } from '@/api/settings';
import { avoidSunday, todayISO } from '@/utils/date';
import type { WidgetData, WidgetDay } from './schedule-widget';

type SelectedGroupForWidget = {
  id: number;
  building_slug: string;
};

const WIDGET_SNAPSHOT_KEY = 'widget.snapshot';

const EMPTY_DATA: WidgetData = {
  days: [
    { date: todayISO(), label: 'СЕГОДНЯ', published: false, pairs: [] },
    { date: todayISO(), label: 'ЗАВТРА', published: false, pairs: [] },
  ],
};

/**
 * Данные печатаем из общего хранилища (одно и то же для app и widget-хендлера
 * — оба процесса выполняются в JS-рантайме приложения).
 */
export async function loadWidgetData(useCache = false): Promise<WidgetData> {
  const group = storage.get<SelectedGroupForWidget | null>('schedule.selectedGroup', null);
  if (!group) {
    return EMPTY_DATA;
  }

  if (useCache) {
    const cached = storage.get<Snapshot | null>(WIDGET_SNAPSHOT_KEY, null);
    if (cached && cached.groupId === group.id) {
      return cached.data;
    }
  }

  try {
    const today = todayISO();
    const date = avoidSunday(today);
    const url = `${PUSH_API_URL}/api/widget?group=${group.id}&building=${group.building_slug}&date=${date}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`widget api ${response.status}`);
    }

    const fresh = (await response.json()) as { days: WidgetDay[] };
    const data: WidgetData = {
      days: fresh.days.map((day) => ({
        ...day,
        pairs: day.pairs.map((pair) => ({
          ...pair,
        })),
      })),
    };

    setSnapshot(group.id, data);
    return data;
  } catch {
    const cached = storage.get<Snapshot | null>(WIDGET_SNAPSHOT_KEY, null);
    return cached?.data ?? EMPTY_DATA;
  }
}

export function setSnapshot(groupId: number, data: WidgetData): void {
  storage.set(WIDGET_SNAPSHOT_KEY, { groupId, data });
}

export function getSnapshot(): { groupId: number; data: WidgetData } | null {
  return storage.get(WIDGET_SNAPSHOT_KEY, null);
}

type Snapshot = {
  groupId: number;
  data: WidgetData;
};
