import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="(schedule)">
        <NativeTabs.Trigger.Label>Расписание</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(teachers)">
        <NativeTabs.Trigger.Label>Преподаватели</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="groups" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(rooms)">
        <NativeTabs.Trigger.Label>Кабинеты</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="door.left.hand.open" md="meeting_room" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
