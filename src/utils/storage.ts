// Полифилл ключ-значение хранилища на expo-sqlite/localStorage (см. expo-native-ui/storage)
import '@/utils/storage-install';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

/**
 * Кэш распарсенных значений: useSyncExternalStore требует стабильные
 * ссылки между вызовами getSnapshot (Object.is), поэтому возвращаем
 * один и тот же объект, пока сырая строка не изменилась.
 */
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    const raw = localStorage.getItem(key);
    const cached = snapshotCache.get(key);

    if (cached && cached.raw === raw) {
      return cached.value as T;
    }

    let value: unknown;
    if (raw != null) {
      try {
        value = JSON.parse(raw);
      } catch {
        value = defaultValue;
      }
    } else {
      value = defaultValue;
    }

    snapshotCache.set(key, { raw, value });
    return value as T;
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
    const raw = localStorage.getItem(key);
    snapshotCache.set(key, { raw, value });
    listeners.get(key)?.forEach((fn) => fn());
  },

  remove(key: string): void {
    localStorage.removeItem(key);
    snapshotCache.set(key, { raw: null, value: undefined });
    listeners.get(key)?.forEach((fn) => fn());
  },

  subscribe(key: string, listener: Listener): () => void {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(listener);

    return () => set?.delete(listener);
  },
};
