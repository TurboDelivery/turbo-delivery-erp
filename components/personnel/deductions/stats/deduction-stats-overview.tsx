"use client";

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryStates } from 'nuqs';
import DeductionStatCard from '@/components/personnel/deductions/stats/deduction-stat-card';
import { deductionFiltersClient } from '@/features/personnel/filters/deduction.filter';
import { usePayrollStatsDetailsQuery } from '@/features/personnel/queries/payroll.query';

const toYearMonthParam = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

function DeductionStatsOverview() {
  const [filters] = useQueryStates(deductionFiltersClient.filter, deductionFiltersClient.option);
  const monthParam = toYearMonthParam(filters.year, filters.month);
  const { data: apiStats } = usePayrollStatsDetailsQuery(monthParam);

  const monthLabel = format(new Date(filters.year, filters.month - 1, 1), 'MMMM yyyy', { locale: fr });
  const stats = [
    { label: 'Masse salariale brute', value: apiStats?.masseBrute ?? 0, color: 'default' as const },
    { label: 'Total déductions', value: apiStats?.totalDeductions ?? 0, color: 'red' as const },
    { label: 'Déductions en attente', value: apiStats?.pendingDeductions ?? 0, color: 'orange' as const },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <DeductionStatCard key={stat.label} label={stat.label} value={stat.value} description={monthLabel} color={stat.color} />
      ))}
    </div>
  );
}

export default DeductionStatsOverview;
