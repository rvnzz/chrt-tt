import { useQuery } from '@tanstack/react-query';

import { fetchBellSchedule } from '@/api/bells';

/**
 * Звонки на дату: переопределение с дэшборда или шаблон по умолчанию.
 * Вместе с расписанием недели не меняется — держим дольше.
 */
export function useBell(dateISO: string) {
  return useQuery({
    queryKey: ['bell', dateISO],
    queryFn: ({ signal }) => fetchBellSchedule(dateISO, signal),
    staleTime: 1000 * 60 * 30,
  });
}
