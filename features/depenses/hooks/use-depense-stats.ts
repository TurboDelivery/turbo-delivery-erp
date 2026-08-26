import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

export const useDepenseStats = () => {
  const { filters } = useDepenseDashboardFilters();
  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense, // Les categories font partie de la cle de cache : sans elles le filtre ne rafraichit rien
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
