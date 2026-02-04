'use client';

import StatisticDepenseCards from '@/feature-finance/depenses/components/statistiques/statistic-depense-cards';
import RepartitionDepense from '@/feature-finance/depenses/components/repartition/index';
import DepenseTabs from '@/components/depenses/depense-table/depense-tabs';
import DepenseHeader from '@/components/components-finance/depenses/header';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import DateFilterInput from '@/components/finance/date-filter-input';

export default function DepensePageContent() {
  const { filters, handleDateChange } = useDepenseDashboardFilters();

  return (
    <div className="flex flex-col gap-6 px-4">
      <DepenseHeader />
      <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      <StatisticDepenseCards />
      <RepartitionDepense />
      <DepenseTabs />
    </div>
  );
}
