import { useQueryStates } from 'nuqs';
import { parseAsString } from 'nuqs';

// Filtres pour le graphe annuel avec sélection d'année
const investissementYearlyFiltersClient = {
  filters: {
    year: parseAsString.withDefault(new Date().getFullYear().toString()),
  },
  options: {
    shallow: true,
  },
};

export function useInvestissementMonthlyFilters() {
  const [filters, setFilters] = useQueryStates(
    investissementYearlyFiltersClient.filters,
    investissementYearlyFiltersClient.options,
  );

  const updateYear = (year: string) => {
    setFilters({ year });
  };

  const clearFilters = () => {
    setFilters({
      year: investissementYearlyFiltersClient.filters.year.defaultValue,
    });
  };

  return {
    year: filters.year,
    updateYear,
    clearFilters,
    setFilters
  };
}

