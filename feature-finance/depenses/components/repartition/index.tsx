'use client';

import RepartitionDepensePieChart from '@/feature-finance/depenses/components/repartition/repartition-depense-pie-chart';
import DepenseLineChart from '@/feature-finance/depenses/components/repartition/depense-line-chart';
import { DepenseSummaryPieChartTable } from '@/components/depenses/charts/depense-summary-pie-chart-table';
import React from 'react';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

export default function RepartitionDepense() {
  const {filters} = useDepenseDashboardFilters();
  return (
    <div className="grid grid-cols-5 gap-4">
      <DepenseSummaryPieChartTable className="col-span-3" debut={filters.debut} fin={filters.fin} categoriesDepense={filters.categoriesDepense} />
      <RepartitionDepensePieChart className="col-span-2" />
      <DepenseLineChart className="col-span-full" />
    </div>
  );
}
