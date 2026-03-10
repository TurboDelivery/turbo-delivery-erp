import { useDepenseSummaryQuery } from '@/feature-finance/depenses/queries/depense-summary.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

export const useDepenseSummary = () => {
  const { filters } = useDepenseDashboardFilters();
  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense, // ✅ AJOUTÉ: Inclure les catégories pour forcer la mise à jour
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
