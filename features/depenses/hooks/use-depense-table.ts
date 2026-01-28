import { useDepensesListQuery } from '@/feature-finance/depenses/queries/depense-list.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { useGenericTable, type GenericTableFilters } from '@/hooks/use-generic-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { IDepense } from '@/feature-finance/depenses/types/depense.type';

interface DepenseFilters extends GenericTableFilters {
  debut: Date;
  fin: Date;
  categoriesDepense?: string[] | null;
}

export const useDepenseTable = () => {
  const { filters, setFilters } = useDepenseDashboardFilters();

  const currentSearchParams = {
    page: filters?.page ?? 0,
    limit: filters?.limit ?? 50,
    debut: filters.debut,
    fin: filters.fin,
    orderBy: filters.orderBy,
    orderDirection: filters.orderDirection as 'asc' | 'desc' | undefined,
  };

  const { data: depensesData, isLoading, error, isError, isFetching } = useDepensesListQuery(currentSearchParams);

  const result = useGenericTable<IDepense, DepenseFilters>({
    columns: depenseColumns,
    initialFilters: filters as unknown as DepenseFilters,
    queryResult: {
      data: depensesData,
      isLoading,
      isError,
      isFetching,
    },
  });

  // Synchroniser les filtres locaux avec les filtres globaux
  const syncedSetFilters = (fn: (prev: DepenseFilters) => DepenseFilters) => {
    const newFilters = fn(filters as unknown as DepenseFilters);
    setFilters(newFilters as typeof filters);
  };

  const setSelectedCategories = (categoryIds: string[] | null) => {
    syncedSetFilters((prev) => ({
      ...prev,
      categoriesDepense: categoryIds,
      page: 0, // Reset to first page when filters change
    }));
  };

  return {
    ...result,
    setFilters: syncedSetFilters,
    depenses: result.data, // result.data est déjà le tableau (content)
    depensesData, // Pour compatibilité si besoin de l'objet complet
    error,
    filters,
    setSelectedCategories,
  };
};
