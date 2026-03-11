'use client';

import StatisticDepenseCards from '@/feature-finance/depenses/components/statistiques/statistic-depense-cards';
import RepartitionDepense from '@/feature-finance/depenses/components/repartition/index';
import DepenseTabs from '@/components/depenses/depense-table/depense-tabs';
import DepenseHeader from '@/components/components-finance/depenses/header';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import DateFilterInput from '@/components/finance/date-filter-input';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { Button } from '@heroui/react';
import { useDepenseExport } from '@/features/depenses/hooks/use-depense-export';

export default function DepensePageContent() {
  const { filters, handleDateChange, handleCategoriesChange } = useDepenseDashboardFilters();
  const { exportDepensesToExcel, isLoadingDepenseExport } = useDepenseExport();

  const handleExport = () => {
    exportDepensesToExcel({
      debut: filters.debut,
      fin: filters.fin,
      categoriesDepense: filters.categoriesDepense,
    });
  };

  return (
    <div className="flex flex-col gap-6 px-4 ">
      <DepenseHeader />
      <div className="flex items-center justify-end gap-4">
        <Button 
          color="success"
          variant="flat"
          isLoading={isLoadingDepenseExport}
          onPress={handleExport}
        >
          {isLoadingDepenseExport ? 'Exportation...' : 'Exporter (Excel)'}
        </Button>
        <CategoriesSelectFilter selectedCategories={filters.categoriesDepense || []} onCategoriesChange={handleCategoriesChange} />
        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      </div>
      <StatisticDepenseCards />
      <RepartitionDepense />
      <DepenseTabs />
    </div>
  );
}
