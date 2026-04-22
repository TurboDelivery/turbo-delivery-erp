import { useQueryStates } from 'nuqs';
import { depenseFiltersClient } from '@/features/depenses/filters/depense.filters';
import { DateRange } from 'react-day-picker';

export function useDepenseDashboardFilters() {
  const [filters, setFilters] = useQueryStates(depenseFiltersClient.filters, depenseFiltersClient.options);
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      debut: depenseFiltersClient.filters.debut.defaultValue,
      fin: depenseFiltersClient.filters.fin.defaultValue,
      categoriesDepense: depenseFiltersClient.filters.categoriesDepense.defaultValue,
      limit: depenseFiltersClient.filters.limit.defaultValue,
      page: depenseFiltersClient.filters.page.defaultValue,
      orderBy: depenseFiltersClient.filters.orderBy.defaultValue,
      orderDirection: depenseFiltersClient.filters.orderDirection.defaultValue,
    });
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev) => ({
        ...prev,
        debut: value.from,
        fin: value.to,
      }));
    }
  };

  const handleCategoriesChange = (categoryIds: string[] | null) => {
    setFilters({
      categoriesDepense: categoryIds || [],
      page: 0,
    });
  };

  return { filters, updateFilters, clearFilters, handleDateChange, handleCategoriesChange, setFilters };
}
