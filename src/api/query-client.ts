import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Полифилл localStorage на native — используется перзистером для офлайн-кэша
import '@/utils/storage-install';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 2,
    },
  },
});

/** Персистим кэш React Query в localStorage (resilient-офлайн) */
export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key) => localStorage.getItem(key) ?? null,
    setItem: (key, value) => {
      localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  },
  key: 'chrt-tt-query-cache',
  throttleTime: 1000,
});
