import { useTicketsListQuery } from '@/features/tickets/queries/ticket-list.query';
import { useTicketFilters } from '@/features/tickets/hooks/useTicketFilters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { useMemo } from 'react';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';

export default function useTickets() {
  const { filters, setFilter, resetFilters } = useTicketFilters();

  const currentSearchParams: ITicketParams = useMemo(() => {
    return {
      search: filters.search,
      livreurId: filters.livreurId,
      restaurantId: filters.restaurantId,
      debut: filters.debut,
      fin: filters.fin,
    };
  }, [filters]);

  const { data, isLoading, isError, error } = useTicketsListQuery(currentSearchParams);
  const ticketsData = data?.content?.map(bonLivraisonToTicket) || [];
  return {
    filters,
    setFilter,
    resetFilters,
    ticketsData,
    isLoading,
    isError,
    error,
  };
}
