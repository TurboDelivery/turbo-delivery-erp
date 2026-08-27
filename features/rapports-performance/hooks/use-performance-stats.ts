import { usePerformanceFilters } from '@/features/rapports-performance/hooks/use-performance-filters';
import { usePerformanceQuery } from '@/features/rapports-performance/queries/performance.query';
import { IPerformanceParams } from '@/features/rapports-performance/types/performance.type';

export const usePerformanceStats = () => {
  const { filters } = usePerformanceFilters();

  const params: IPerformanceParams = {
    debut: filters.debut,
    fin: filters.fin,
    ...(filters.restaurantId ? { restaurantId: filters.restaurantId } : {}),
  };

  const { data, isLoading, isFetching, error, isError, refetch } = usePerformanceQuery(params);

  return {
    data,
    isLoading,
    // Expose pour bloquer le bouton « Reessayer » pendant la nouvelle tentative :
    // apres un echec la query reste en statut error, isLoading ne repasse plus a vrai.
    isFetching,
    error,
    isError,
    refetch,
  };
};
