import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

/**
 * Убирает Permissions READ/WRITE_EXTERNAL_STORAGE, которые expo-image и
 * expo-file-system добавляют для Android ≤ 12.
 *
 * Манифест библиотек вливается Gradle-меромером позже, поэтому в манифест
 * вставляется директива tools:node="remove" — слияние учитывает её и итоговый
 * APK/AAB не содержит разрешение независимо от библиотек.
 *
 * Приложение работает только с приватными каталогами и сетью.
 */
const BLOCKED = ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'].map(
  (name) => `android.permission.${name}`,
);

const stripStoragePermissions: ConfigPlugin = (config) =>
  withAndroidManifest(config, (mod) => {
    const manifestBody = mod.modResults.manifest;
    manifestBody.$ = { ...manifestBody.$, 'xmlns:tools': 'http://schemas.android.com/tools' };

    // 1) убираем существующие объявления этих разрешений,
    // 2) добавляем единственную директиву tools:node="remove" на каждое имя —
    //    merge учтёт её и не позволит библиотекам добавить их в итоговый манифест
    manifestBody['uses-permission'] = [
      ...(manifestBody['uses-permission'] ?? []).filter(
        (entry) => !BLOCKED.includes(entry.$['android:name'] ?? ''),
      ),
      ...BLOCKED.map((name) => ({
        $: {
          'android:name': name,
          'tools:node': 'remove',
        },
      })),
    ];

    return mod;
  });

export default stripStoragePermissions;
