import { usePerformanceFilters } from '@/feature-finance/rapports-performance/hooks/use-performance-filters';
import { usePerformanceQuery } from '@/feature-finance/rapports-performance/queries/performance.query';
import { IPerformanceParams } from '@/feature-finance/rapports-performance/types/performance.type';

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
