import { useQueries } from '@tanstack/react-query';

import { BellSchedule, fetchBellSchedule } from '@/api/bells';

/** Звонки сразу на несколько дат (например, на все дни недели учителя/кабинета). */
export function useBellMap(dates: string[]): Map<string, BellSchedule> {
  const unique = [...new Set(dates)];

  const queries = useQueries({
    queries: unique.map((date) => ({
      queryKey: ['bell', date],
      queryFn: ({ signal }) => fetchBellSchedule(date, signal),
      staleTime: 1000 * 60 * 30,
    })),
  });

  const map = new Map<string, BellSchedule>();
  unique.forEach((date, index) => {
    const data = queries[index]?.data;
    if (data) {
      map.set(date, data);
    }
  });

  return map;
}
