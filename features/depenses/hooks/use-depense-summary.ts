import { useDepenseSummaryQuery } from '@/features/depenses/queries/depense-summary.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

export const useDepenseSummary = () => {
  const { filters } = useDepenseDashboardFilters();
  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense, // âœ… AJOUTÃ‰: Inclure les catÃ©gories pour forcer la mise Ã  jour
  };

  const { data, isLoading, error, isError, refetch } = useDepenseSummaryQuery(currentSearchParams);

  return {
    data,
    isLoading,
    error,
    isError,
    refetch,
  };
};

