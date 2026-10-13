import { useRouter } from 'expo-router';

import { GroupPickerList } from '@/components/schedule/group-picker-list';
import { ThemedView } from '@/components/themed-view';
import { useSelectedGroup } from '@/hooks/use-selected-group';

export default function GroupsScreen() {
  const router = useRouter();
  const [, setGroup] = useSelectedGroup();

  return (
    <ThemedView style={{ flex: 1 }}>
      <GroupPickerList
        onSelect={(group) => {
          setGroup(group);
          router.back();
        }}
      />
    </ThemedView>
  );
}
