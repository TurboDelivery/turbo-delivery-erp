import { useLivreurFilters } from '@/features/tickets/hooks/use-livreur-filters';
import { useMemo } from 'react';
import { useLivreurStatsQuery } from '@/features/tickets/queries/livreur-stats.query';

export function useLivreurStats() {
  const { filters } = useLivreurFilters();
  const currentFilters = useMemo(() => {
    return {
      livreurId: filters.idLivreur.trim(),
      debut: filters.creneauDebut,
      fin: filters.creneauFin,
      restaurantId: filters.idRestaurant.trim(),
    };
  }, [filters]);

  const { data, isLoading, isError, error } = useLivreurStatsQuery(currentFilters);

  return {
    livreurStats: {
      totalLivraisons: data?.totalLivraisons || 0,
      totalTickets: data?.totalTickets || 0,
      primeHebdo: data?.primeHebdo
    },
    isLoading,
    isError,
    error,
  };
}
