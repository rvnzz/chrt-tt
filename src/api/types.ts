/**
 * Типы ответа API timet.eremin.tech
 * GET /embed/all/week/data?date=YYYY-MM-DD
 */

export type Building = {
  name: string;
  slug: string;
  max_pairs: number;
};

export type GroupRef = {
  id: number;
  name: string;
  course_number: number;
  building_name?: string;
  building_slug?: string;
};

export type Lesson = {
  /** Номер подгруппы (1 | 2) или null для общей пары */
  subgroup: number | null;
  subject: string;
  teacher_id: number;
  teacher: string;
  room: string;
};

export type Pair = {
  number: number;
  is_split: boolean;
  lessons: Lesson[];
  has_content: boolean;
};

export type GroupSchedule = GroupRef & {
  pairs: Pair[];
};

export type Assignment = {
  group_id: number;
  group_name: string;
  course_number: number;
  pair_number: number;
  subgroup: number | null;
  subject: string;
  room: string;
  teacher: string;
};

export type TeacherDay = {
  id: number;
  name: string;
  assignments: Assignment[];
};

export type RoomDay = {
  room: string;
  assignments: Assignment[];
};

export type BuildingDay = {
  building: Building;
  date: string;
  is_published: boolean;
  has_schedule: boolean;
  groups: GroupRef[];
  group_schedules: GroupSchedule[];
  teachers: TeacherDay[];
  rooms: RoomDay[];
};

export type Day = {
  date: string;
  has_schedule: boolean;
  buildings: BuildingDay[];
};

export type AllWeekData = {
  mode: 'week';
  scope: 'all';
  title: string;
  week_start: string;
  week_end: string;
  anchor_date: string;
  groups: (GroupRef & { building_name: string; building_slug: string })[];
  days: Day[];
};

/** Нормализованная карточка пары для UI */
export type PairCardData = {
  number: number;
  isSplit: boolean;
  lessons: Lesson[];
};

export type DayRef = {
  date: string;
  hasSchedule: boolean;
};
