import { useLivreurTicketsListQuery } from '@/features/tickets/queries/livreur-ticket-list.query';
import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';

export function useLivreurTicket() {
  const { filters, setFilter } = useTicketFilters();

  const { data, isLoading, isError, refetch } = useLivreurTicketsListQuery(filters);

  const livreurTickets = data?.content || [];

  const meta = {
    totalItems: data?.totalElements || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.pageable.pageNumber || 0,
    itemsPerPage: data?.pageable.pageSize || 0,
  };

  return {
    filters,
    setFilter,
    livreurTickets,
    isLoadingLivreurTickets: isLoading,
    isErrorLivreurTickets: isError,
    refetchLivreurTickets: refetch,
    livreurTicketsMeta: meta,
  };
}