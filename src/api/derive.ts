import { AllWeekData, Assignment, DayRef, GroupRef, Pair } from '@/api/types';
import { weekdayIndex } from '@/utils/date';
import { SelectedGroup } from '@/hooks/use-selected-group';

/** Пары группы в конкретный день (с содержимым), отсортированные по номеру */
export function findGroupPairs(
  week: AllWeekData,
  group: SelectedGroup,
  date: string,
): Pair[] {
  for (const day of week.days) {
    if (day.date !== date) continue;

    const building = day.buildings.find((b) => b.building.slug === group.building_slug);
    const schedule = building?.group_schedules.find((g) => g.id === group.id);

    return (schedule?.pairs ?? [])
      .filter((pair) => pair.has_content && pair.lessons.length > 0)
      .sort((a, b) => a.number - b.number);
  }

  return [];
}

/** Все группы недели как варианты для выбора */
export function collectGroups(week: AllWeekData): Required<GroupRef>[] {
  if (week.groups.length > 0) {
    return [...week.groups].sort(
      (a, b) =>
        a.building_slug.localeCompare(b.building_slug) ||
        a.course_number - b.course_number ||
        a.name.localeCompare(b.name),
    );
  }

  // Запасной вариант: собираем группы из дней
  const byId = new Map<number, Required<GroupRef>>();
  for (const day of week.days) {
    for (const building of day.buildings) {
      for (const group of building.groups) {
        byId.set(group.id, {
          ...group,
          building_name: building.building.name,
          building_slug: building.building.slug,
        });
      }
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.building_slug.localeCompare(b.building_slug) ||
      a.course_number - b.course_number ||
      a.name.localeCompare(b.name),
  );
}

export type DaySchedule = {
  date: string;
  items: Assignment[];
};

/** Расписание преподавателя на неделю (по дням) */
export function collectTeacherWeek(week: AllWeekData, teacherId: number): DaySchedule[] {
  const result: DaySchedule[] = [];

  for (const day of week.days) {
    const items: Assignment[] = [];

    for (const building of day.buildings) {
      const teacher = building.teachers.find((t) => t.id === teacherId);
      if (!teacher) continue;

      for (const assignment of teacher.assignments) {
        items.push({ ...assignment, room: assignment.room || building.building.name });
      }
    }

    items.sort((a, b) => a.pair_number - b.pair_number);
    result.push({ date: day.date, items });
  }

  return result.filter((d) => d.items.length > 0);
}

export type TeacherRef = {
  id: number;
  name: string;
  buildings: string[];
};

/** Все преподаватели недели (уникальные) */
export function collectTeachers(week: AllWeekData): TeacherRef[] {
  const byId = new Map<number, { name: string; buildings: Set<string> }>();

  for (const day of week.days) {
    for (const building of day.buildings) {
      for (const teacher of building.teachers) {
        const entry = byId.get(teacher.id) ?? { name: teacher.name, buildings: new Set<string>() };
        entry.buildings.add(building.building.name);
        byId.set(teacher.id, entry);
      }
    }
  }

  return [...byId.entries()]
    .map(([id, entry]) => ({ id, name: entry.name, buildings: [...entry.buildings] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type RoomRef = {
  name: string;
  buildings: string[];
};

/** Все аудитории недели */
export function collectRooms(week: AllWeekData): RoomRef[] {
  const byRoom = new Map<string, Set<string>>();

  for (const day of week.days) {
    for (const building of day.buildings) {
      for (const entry of building.rooms) {
        const set = byRoom.get(entry.room) ?? new Set<string>();
        set.add(building.building.name);
        byRoom.set(entry.room, set);
      }
    }
  }

  return [...byRoom.entries()]
    .map(([name, buildings]) => ({ name, buildings: [...buildings] }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/** Занятость аудитории на неделю (по дням) */
export function collectRoomWeek(week: AllWeekData, roomName: string): DaySchedule[] {
  const result: DaySchedule[] = [];

  for (const day of week.days) {
    const items: Assignment[] = [];

    for (const building of day.buildings) {
      const room = building.rooms.find((r) => r.room === roomName);
      if (!room) continue;

      for (const assignment of room.assignments) {
        items.push({ ...assignment, room: assignment.room || building.building.name });
      }
    }

    items.sort((a, b) => a.pair_number - b.pair_number);
    result.push({ date: day.date, items });
  }

  return result.filter((d) => d.items.length > 0);
}

/** Список дней недели для панели выбора (воскресенье не показываем) */
export function collectDays(week: AllWeekData): DayRef[] {
  return week.days
    .filter((day) => weekdayIndex(day.date) !== 6) // воскресенье — не показываем
    .map((day) => ({ date: day.date, hasSchedule: day.has_schedule }));
}
