'use client';

import StatisticDepenseCards from '@/feature-finance/depenses/components/statistiques/statistic-depense-cards';
import RepartitionDepense from '@/feature-finance/depenses/components/repartition/index';
import DepenseTabs from '@/components/depenses/depense-table/depense-tabs';
import DepenseHeader from '@/components/components-finance/depenses/header';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import DateFilterInput from '@/components/finance/date-filter-input';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';

export default function DepensePageContent() {
  const { filters, handleDateChange, handleCategoriesChange } = useDepenseDashboardFilters();

  return (
    <div className="flex flex-col gap-6 px-4">
      <DepenseHeader />
      <div className="flex items-center justify-end gap-4">
        <CategoriesSelectFilter selectedCategories={filters.categoriesDepense || []} onCategoriesChange={handleCategoriesChange} />
        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      </div>
      <StatisticDepenseCards />
      <RepartitionDepense />
      <DepenseTabs />
    </div>
  );
}
