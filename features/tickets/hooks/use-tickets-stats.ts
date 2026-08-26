import { useTicketsStatsQuery } from '@/features/tickets/queries/ticket-stats.query';
import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';

export function useTicketsStats() {
  const { filters } = useTicketFilters();

  const currentSearchParams: ITicketParams = {
    page: filters.page,
    size: filters.size,
    search: filters.search,
    livreurId: filters.livreurId,
    restaurantId: filters.restaurantId,
    debut: filters.debut,
    fin: filters.fin,
  };

  const { data, isLoading, isError, error, refetch } = useTicketsStatsQuery(currentSearchParams);

  return {
    ticketsStats: {
      totalRevenus: data?.revenus || 0,
      totalTickets: data?.tickets || 0,
      totalLivreurs: data?.livreurs || 0,
      totalPartenaires: data?.restaurants || 0,
      totalCommissions: data?.totalCommissions || 0,
    },
    isLoading,
    isError,
    refetch,
    error,
  };
}
