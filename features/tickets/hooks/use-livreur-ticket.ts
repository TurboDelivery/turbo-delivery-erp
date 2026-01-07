import { useLivreurTicketsListQuery } from '@/features/tickets/queries/livreur-ticket-list.query';
import { useLivreurFilters } from '@/features/tickets/hooks/use-livreur-filters';
import { PageMeta } from '@/types/general';

export function useLivreurTicket() {
  const { filters, setFilter, setLivreurWeekFilter, setLivreurSearch } = useLivreurFilters();

  const { data, isLoading, isError, refetch } = useLivreurTicketsListQuery(filters);

  const livreurTickets = data?.content || [];

  const handlePageChange = (newPage: number) => {
    setFilter('livreurPage', newPage);
  };

  const meta: PageMeta = {
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
    handlePageChange,
    setLivreurWeekFilter,
    setLivreurSearch,
  };
}
