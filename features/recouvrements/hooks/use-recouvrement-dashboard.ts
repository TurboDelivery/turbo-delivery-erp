import { useQueryStates } from 'nuqs';
import { recouvrementDashboardFilterClient } from '@/features/recouvrements/filters/recouvrement-dashboard-filter';
import { DateRange } from 'react-day-picker';
import { RecouvrementTabsType } from '@/features/recouvrements/types';

function useRecouvrementDashboard() {
  const [filters, setFilters] = useQueryStates(recouvrementDashboardFilterClient.filters);

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev) => ({
        ...prev,
        debut: value.from,
        fin: value.to,
      }));
    }
  };

  const handleTabChange = (tab: RecouvrementTabsType) => {
    setFilters((prev) => ({
      ...prev,
      tab,
    }));
  };

  return {
    filters,
    handleDateChange,
    handleTabChange,
  };
}

export default useRecouvrementDashboard;