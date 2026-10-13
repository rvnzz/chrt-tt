import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GroupPickerList } from '@/components/schedule/group-picker-list';
import { TeacherPickerList } from '@/components/schedule/teacher-picker-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSelectedGroup } from '@/hooks/use-selected-group';
import { Role, useMyTeacher, useUserRole } from '@/hooks/use-user';

/**
 * Встроенный онбординг внутри таба «Расписание»:
 * стадии «роль → выбор группы / выбор себя» без навигации между роутами.
 */
export function RoleFlow() {
  const [role] = useUserRole();
  const [, setRole] = useUserRole();
  const [group, setGroup] = useSelectedGroup();
  const [myTeacher, setMyTeacher] = useMyTeacher();

  if (!role) {
    return <RoleStage onPick={(next: Role) => setRole(next)} />;
  }

  if (role === 'student' && !group) {
    return (
      <FlowStage title="Выберите группу" caption="Найдите свою группу — она сохранится и станет основной.">
        <GroupPickerList onSelect={setGroup} />
      </FlowStage>
    );
  }

  if (role === 'teacher' && !myTeacher) {
    return (
      <FlowStage title="Выберите себя" caption="Найдите себя в списке преподавателей.">
        <TeacherPickerList onSelect={setMyTeacher} />
      </FlowStage>
    );
  }

  // Здесь не должны оказаться: вызывающий экран проверяет профиль до этого
  return null;
}

/** Стадия «Кто вы?» */
function RoleStage({ onPick }: { onPick: (role: Role) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
      <ThemedText type="subtitle">Кто вы?</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        Выберите роль — она сохранится, и приложение подстроит расписание под вас.
      </ThemedText>

      <RoleCard
        emoji="🎓"
        title="Я студент"
        description="Расписание моей группы, пары по дням"
        onPress={() => onPick('student')}
      />
      <RoleCard
        emoji="👩‍🏫"
        title="Я преподаватель"
        description="Свои пары и аудитории по неделям"
        onPress={() => onPick('teacher')}
      />
    </ScrollView>
  );
}

/** Заголовок стадии с содержимым (список) */
function FlowStage({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedView style={styles.flex}>
      <View style={styles.stageHeader}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {caption}
        </ThemedText>
      </View>
      {children}
    </ThemedView>
  );
}

function RoleCard({
  emoji,
  title,
  description,
  onPress,
}: {
  emoji: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="subtitle" style={styles.emoji}>
          {emoji}
        </ThemedText>
        <View style={styles.cardText}>
          <ThemedText type="default">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  caption: {
    marginTop: -Spacing.two,
  },
  stageHeader: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: 16,
    borderCurve: 'continuous',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  emoji: {
    fontSize: 40,
    lineHeight: 44,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
