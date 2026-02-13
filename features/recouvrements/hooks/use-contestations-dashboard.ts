import { useQueryStates } from 'nuqs';
import { contestationsDashboardFilterClient } from '@/features/recouvrements/filters/contestations-dashboard-filter';
import { DateRange } from 'react-day-picker';

function useContestationsDashboard() {
  const [filters, setFilters] = useQueryStates(contestationsDashboardFilterClient.filters);

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev: any) => ({
        ...prev,
        debut: value.from,
        fin: value.to,
      }));
    }
  };

  const handleRestaurantChange = (restaurantId: string | undefined) => {
    setFilters((prev: any) => ({
      ...prev,
      restaurantId: restaurantId || '',
    }));
  };

  const handleStatusChange = (status: string | undefined) => {
    setFilters((prev: any) => ({
      ...prev,
      status: (status || '') as any,
    }));
  };

  return {
    filters,
    handleDateChange,
    handleRestaurantChange,
    handleStatusChange,
    setFilters,
  };
}

export default useContestationsDashboard;



