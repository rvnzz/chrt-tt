import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

/**
 * OTA-обновление (EAS Update):
 * - бинарник умеет тянуть JS-обновления своего канала автоматически (ON_LOAD);
 * - хук даёт: фоновую проверку при входе и кнопку «установить обновление сейчас».
 *
 * В dev-клиенте/Expo Go и на web не активно.
 */
export type OtaStatus =
  | 'unavailable'
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'uptodate'
  | 'error';

export function useOta(onStatus?: () => void) {
  const [status, setStatus] = useState<OtaStatus>('idle');

  const check = async () => {
    if (!updatesSupported()) {
      setStatus('unavailable');
      return;
    }

    try {
      setStatus('checking');
      onStatus?.();

      const result = await Updates.checkForUpdateAsync();

      if (!result.isAvailable) {
        setStatus('uptodate');
        return;
      }

      setStatus('downloading');
      await Updates.fetchUpdateAsync();
      setStatus('ready');
      onStatus?.();
    } catch (error) {
      console.warn('[ota] проверка не удалась:', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    // setState внутри колбэка (не в теле эффекта) — при запуске детект сразу
    const timer = setTimeout(() => {
      void check();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = async () => {
    if (status !== 'ready') return;
    await Updates.reloadAsync();
  };

  return { status, check, restart };
}

function updatesSupported(): boolean {
  if (process.env.EXPO_OS === 'web') return false;
  try {
    return Updates.isEnabled && !__DEV__;
  } catch {
    return false;
  }
}
