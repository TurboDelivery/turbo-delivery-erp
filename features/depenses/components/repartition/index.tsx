'use client';

import RepartitionDepensePieChart from '@/features/depenses/components/repartition/repartition-depense-pie-chart';
import DepenseLineChart from '@/features/depenses/components/repartition/depense-line-chart';
import { DepenseSummaryPieChartTable } from '@/components/depenses/charts/depense-summary-pie-chart-table';
import React from 'react';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';

interface RepartitionDepenseProps {
  debut?: Date;
  fin?: Date;
}

export default function RepartitionDepense({ debut: debutProp, fin: finProp }: RepartitionDepenseProps = {}) {
  const { filters } = useDepenseDashboardFilters();
  const debut = debutProp ?? filters.debut;
  const fin = finProp ?? filters.fin;
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <DepenseSummaryPieChartTable className="col-span-1 md:col-span-3" debut={debut} fin={fin} categoriesDepense={filters.categoriesDepense} />
      <RepartitionDepensePieChart className="col-span-1 md:col-span-2" debut={debut} fin={fin} />
      <DepenseLineChart className="col-span-1 md:col-span-full" />
    </div>
  );
}

