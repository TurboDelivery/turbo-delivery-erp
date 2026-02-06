import { useInvestissementStatsSummaryQuery } from '@/features/investissement/queries/investissement-stats-summary.query';
import { useInvestissementStatsFilters } from '@/features/investissement/hooks/use-investissement-stats-filters';

export const useInvestissementStatsSummary = () => {
  const { filters } = useInvestissementStatsFilters();

  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
  };

  const { data, isLoading, error, isError, refetch, isFetching } = useInvestissementStatsSummaryQuery(currentSearchParams);

  return {
    data,
    isLoading,
    error,
    isError,
    refetch,
    isFetching,
  };
};

