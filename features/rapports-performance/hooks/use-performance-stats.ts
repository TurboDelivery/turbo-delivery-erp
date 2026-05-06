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

  const { data, isLoading, error, isError, refetch } = usePerformanceQuery(params);

  return {
    data,
    isLoading,
    error,
    isError,
    refetch,
  };
};
