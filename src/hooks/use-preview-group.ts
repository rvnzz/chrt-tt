import { useSyncExternalStore } from 'react';

import { SelectedGroup } from '@/hooks/use-selected-group';
import { storage } from '@/utils/storage';

/**
 * «Подглядел» группа: расписание другой группы на просмотр,
 * не меняя выбранную (сброс — кнопкой «Вернуться» в дневнике).
 */

const KEY = 'schedule.previewGroup';

export function usePreviewGroup(): [SelectedGroup | null, (value: SelectedGroup | null) => void] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(KEY, cb),
    () => storage.get(KEY, null as SelectedGroup | null),
    () => null as SelectedGroup | null, // getServerSnapshot (web SSR)
  );

  return [value, (next) => storage.set(KEY, next)];
}
