import { useSyncExternalStore } from 'react';

import { storage } from '@/utils/storage';

export type SelectedGroup = {
  id: number;
  name: string;
  course_number: number;
  building_slug: string;
  building_name: string;
};

const KEY = 'schedule.selectedGroup';

export function useSelectedGroup(): [SelectedGroup | null, (group: SelectedGroup | null) => void] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(KEY, cb),
    () => storage.get(KEY, null as SelectedGroup | null),
  );

  return [value, (group) => storage.set(KEY, group)];
}
