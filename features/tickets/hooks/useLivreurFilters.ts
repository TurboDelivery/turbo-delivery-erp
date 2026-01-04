'use client';

import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { useTicketFilters } from './useTicketFilters';

export type LivreurWeekMode = 'this_week' | 'last_week' | 'custom';

export function useLivreurFilters() {
  const { filters, setFilter } = useTicketFilters();

  // 🔎 Recherche texte uniquement sur "search"
  const setLivreurSearch = (value: string) => {
    setFilter('search', value); // tout passe par le search du backend
  };

  // 📆 Gestion des semaines
  const setLivreurWeekFilter = (mode: LivreurWeekMode) => {
    let start: Date;
    let end: Date;

    if (mode === 'this_week') {
      start = startOfWeek(new Date(), { weekStartsOn: 1 });
      end = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (mode === 'last_week') {
      const lastWeek = subWeeks(new Date(), 1);
      start = startOfWeek(lastWeek, { weekStartsOn: 1 });
      end = endOfWeek(lastWeek, { weekStartsOn: 1 });
    } else {
      return; // custom sera géré manuellement
    }

    setFilter('debut', start);
    setFilter('fin', end);
  };

  return {
    search: filters.search ?? '',
    setLivreurSearch,
    setLivreurWeekFilter,
  };
}
