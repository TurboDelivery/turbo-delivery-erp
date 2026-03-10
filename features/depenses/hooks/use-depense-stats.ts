import { useDepenseStatsQuery } from '@/feature-finance/depenses/queries/depense-stats.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

export const useDepenseStats = () => {
  const { filters } = useDepenseDashboardFilters();
  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense, // AJOUTÉ: Inclure les catégories pour forcer la mise à jour
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