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
    const manifest = mod.modResults.manifest;
    manifest.$ = { ...manifest.$, 'xmlns:tools': 'http://schemas.android.com/tools' };

    manifest['uses-permission'] = [
      ...(manifest['uses-permission'] ?? []),
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
