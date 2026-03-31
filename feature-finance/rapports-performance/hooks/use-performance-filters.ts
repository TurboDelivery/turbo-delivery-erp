import { useQueryStates } from 'nuqs';
import { performanceFiltersClient } from '@/feature-finance/rapports-performance/filters/performance.filters';
import { DateRange } from 'react-day-picker';

export function usePerformanceFilters() {
  const [filters, setFilters] = useQueryStates(
    performanceFiltersClient.filters,
    performanceFiltersClient.options,
  );

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      debut: performanceFiltersClient.filters.debut.defaultValue,
      fin: performanceFiltersClient.filters.fin.defaultValue,
      restaurantId: performanceFiltersClient.filters.restaurantId.defaultValue,
    });
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev) => ({
        ...prev,
        debut: value.from!,
        fin: value.to!,
      }));
    }
  };

  const handleRestaurantChange = (restaurantId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      restaurantId: restaurantId ?? '',
    }));
  };

  return { filters, updateFilters, clearFilters, handleDateChange, handleRestaurantChange, setFilters };
}
