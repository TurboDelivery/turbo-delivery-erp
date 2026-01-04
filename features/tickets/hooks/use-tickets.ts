import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { useMemo } from 'react';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';
import { useTicketsInfiniteQuery } from '@/features/tickets/queries/ticket-infinite.query';

export default function useTickets() {
  const { filters, setFilter, resetFilters } = useTicketFilters();

  const currentSearchParams: ITicketParams = useMemo(() => {
    return {
      page: filters.page,
      size: filters.size,
      search: filters.search,
      livreurId: filters.livreurId,
      restaurantId: filters.restaurantId,
      debut: filters.debut,
      fin: filters.fin,
    };
  }, [filters]);

  const { data, isLoading, status, isFetching, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, hasNextPage, isError, error } = useTicketsInfiniteQuery(currentSearchParams);

  const tickets = [...(data?.pages.flatMap((page) => page.content.map(bonLivraisonToTicket)) || [])];

  const totalItems = data?.pages[0]?.totalElements || 0;

  return {
    filters,
    setFilter,
    resetFilters,
    ticketsData: tickets,
    isLoading,
    isError,
    error,
    infiniteState: {
      status,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      fetchNextPage,
      hasNextPage,
      totalItems,
    },
  };
}
