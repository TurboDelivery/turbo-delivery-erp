import { useDepenseStatsQuery } from '@/feature-finance/depenses/queries/depense-stats.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

export const useDepenseStats = () => {
  const { filters } = useDepenseDashboardFilters();
  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
  };

  const { data, isLoading, error, isError, refetch } = useDepenseStatsQuery(currentSearchParams);

  return {
    data,
    isLoading,
    error,
    isError,
    refetch,
  };
};