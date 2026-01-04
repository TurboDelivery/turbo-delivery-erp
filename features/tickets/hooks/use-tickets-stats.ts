import { useTicketsStatsQuery } from '@/features/tickets/queries/ticket-stats.query';
import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';

export function useTicketsStats() {
  const { filters } = useTicketFilters();
  const { data, isLoading, isError, error } = useTicketsStatsQuery(filters);

  return {
    ticketsStats : {
      totalRevenus: data?.revenus || 0,
      totalTickets: data?.tickets || 0,
      totalLivreurs: data?.livreurs || 0,
      totalPartenaires: data?.restaurants || 0,
    },
    isLoading,
    isError,
    error,
  };
}
