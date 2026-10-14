import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OtaBanner } from '@/components/schedule/ota-banner';
import { queryClient, queryPersister } from '@/api/query-client';
import { setupNotificationHandler, usePushSync } from '@/hooks/use-push';

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

/** Держит подписку на пуш-уведомления в актуальном состоянии */
function PushSync() {
  usePushSync();
  return null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: 1000 * 60 * 60 * 24 * 3 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <PushSync />
          <AppTabs />
          <OtaBanner />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
