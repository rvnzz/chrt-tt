/** Все функции работают с датами в локальной таймзоне устройства */

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year!, month! - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Понедельник недели, в которую попадает дата */
export function mondayOf(iso: string): string {
  const date = parseISODate(iso);
  const day = date.getDay(); // 0=Вс … 6=Сб
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

/** 0=Пн … 6=Вс */
export function weekdayIndex(iso: string): number {
  const day = parseISODate(iso).getDay();
  return day === 0 ? 6 : day - 1;
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[weekdayIndex(iso)]!;
}

export function weekdayFull(iso: string): string {
  return WEEKDAYS_FULL[weekdayIndex(iso)]!;
}

export function dayNumber(iso: string): string {
  return String(parseISODate(iso).getDate());
}

/** «12 октября» (год опускаем, если он текущий) */
export function formatDate(iso: string): string {
  const date = parseISODate(iso);
  const month = MONTHS_GENITIVE[date.getMonth()];
  const year = date.getFullYear();
  return `${date.getDate()} ${month}${year !== new Date().getFullYear() ? ` ${year}` : ''}`;
}

/** «12 – 18 октября 2026» */
export function formatRange(startISO: string, endISO: string): string {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const startMonth = MONTHS_GENITIVE[start.getMonth()];
  const endMonth = MONTHS_GENITIVE[end.getMonth()];

  if (startMonth === endMonth) {
    return `${start.getDate()} – ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  }

  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
}
