import {
  GroupOption,
  GroupPickerList,
} from '@/components/schedule/group-picker-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { usePreviewGroup } from '@/hooks/use-preview-group';

export default function GroupsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preview?: string }>();
  const previewMode = params.preview === '1';
  const [, setGroup] = useSelectedGroup();
  const [preview, setPreview] = usePreviewGroup();

  function pick(group: GroupOption) {
    if (previewMode) {
      setPreview(group);
    } else {
      setGroup(group);
    }
    router.back();
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: previewMode ? 'Посмотреть группу' : 'Выбор группы' }} />
      <GroupPickerList
        selectedId={previewMode ? preview?.id : undefined}
        onSelect={pick}
      />
    </ThemedView>
  );
}
