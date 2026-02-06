import { useQueryStates } from 'nuqs';
import { investissementStatsFiltersClient } from '@/features/investissement/filters/investissement-stats.filter';
import { DateRange } from 'react-day-picker';

export function useInvestissementStatsFilters() {
  const [filters, setFilters] = useQueryStates(
    investissementStatsFiltersClient.filters,
    investissementStatsFiltersClient.options,
  );

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      debut: investissementStatsFiltersClient.filters.debut.defaultValue,
      fin: investissementStatsFiltersClient.filters.fin.defaultValue,
    });
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters({
        debut: value.from,
        fin: value.to,
      });
    }
  };

  return { filters, updateFilters, clearFilters, handleDateChange, setFilters };
}

