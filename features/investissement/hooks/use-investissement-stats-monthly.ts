import { useInvestissementStatsMonthlyQuery } from '@/features/investissement/queries/investissement-stats-monthly.query';
import { useInvestissementMonthlyFilters } from '@/features/investissement/hooks/use-investissement-monthly-filters';
import { startOfYear, endOfYear } from 'date-fns';

export const useInvestissementStatsMonthly = () => {
  const { year } = useInvestissementMonthlyFilters();

  const currentSearchParams = {
    debut: startOfYear(new Date(parseInt(year), 0, 1)),
    fin: endOfYear(new Date(parseInt(year), 11, 31)),
  };

  const { data, isLoading, error, isError, refetch, isFetching } = useInvestissementStatsMonthlyQuery(currentSearchParams);

  return {
    data,
    isLoading,
    error,
    isError,
    refetch,
    isFetching,
  };
};

