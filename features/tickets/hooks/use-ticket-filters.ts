'use client';

import { useQueryStates } from 'nuqs';
import { ticketFiltersClient } from '@/features/tickets/filters/tickets.filters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';

export function useTicketFilters() {
  const [filters, setFilters] = useQueryStates(ticketFiltersClient.filters, ticketFiltersClient.option);

  const setFilter = <K extends keyof ITicketParams>(key: K, value: string | Date | number) => {
    if (key === 'debut' || key === 'fin') {
      value = new Date(value);
    }
    void setFilters({ [key]: value });
  };

  const resetFilters = () => {
    void setFilters({
      search: '',
      livreurId: '',
      restaurantId: '',
      debut: filters.debut,
      fin: filters.fin,
      tab: 'tous',
    });
  };

  return { filters, setFilter, resetFilters };
}
