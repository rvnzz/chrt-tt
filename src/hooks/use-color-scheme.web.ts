import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme, ColorSchemeName } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * «Гидратация» отслеживается без useEffect/setState — первый снапшот стабилен.
 */
let hydrated = false;
const hydrationListeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  hydrationListeners.add(cb);
  queueMicrotask(() => {
    hydrated = true;
    cb();
  });

  return () => hydrationListeners.delete(cb);
};

export function useColorScheme(): NonNullable<ColorSchemeName> {
  useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false, // SSR: считаем негидратированным
  );

  return useRNColorScheme() ?? 'light';
}
