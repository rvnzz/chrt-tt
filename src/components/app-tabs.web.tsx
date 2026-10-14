import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const TABS = [
  { href: '/', icon: { ios: 'calendar', web: 'calendar_month' }, label: 'Расписание' },
  { href: '/teachers', icon: { ios: 'person.2', web: 'groups' }, label: 'Преподаватели' },
  { href: '/rooms', icon: { ios: 'door.left.hand.open', web: 'meeting_room' }, label: 'Кабинеты' },
  { href: '/peek', icon: { ios: 'person.2.gobackward', web: 'switch_account' }, label: 'Группы' },
  { href: '/profile', icon: { ios: 'gearshape', web: 'settings' }, label: 'Настройки' },
] as const;

/** Web-табы в стиле мобилки: нижняя панель с иконками (без бренд-плашки). */
export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={[styles.tabBar, { backgroundColor: theme.background, borderTopColor: theme.backgroundElement }]}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.href} name={tab.label} href={tab.href} asChild>
              <TabButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  label,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: (typeof TABS)[number]['icon']; label: string }) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButton, pressed && { opacity: 0.6 }]}>
      <SymbolView
        size={22}
        tintColor={isFocused ? theme.text : theme.textSecondary}
        name={icon}
      />
      <ThemedText
        type="small"
        themeColor={isFocused ? 'text' : 'textSecondary'}
        style={styles.tabLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
});
