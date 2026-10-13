import { useQuery } from '@tanstack/react-query';

import { fetchAllWeek } from '@/api/schedule';
import { mondayOf } from '@/utils/date';

/**
 * Недельное расписание по ключу «понедельник недели» —
 * переключение дней внутри одной недели не вызывает лишних запросов.
 */
export function useWeek(dateISO: string) {
  return useQuery({
    queryKey: ['week', mondayOf(dateISO)],
    queryFn: ({ signal }) => fetchAllWeek(mondayOf(dateISO), signal),
    staleTime: 1000 * 60 * 5,
  });
}
