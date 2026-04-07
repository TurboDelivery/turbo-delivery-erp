import { useMemo } from 'react';
import { useDashboardStatsQuery } from '../queries/dashboard-stats.query';
import { DashboardStatsParams } from '../types/dashboard.types';
import { toMonthlyChartData } from '@/features/dashboard/utils/graphe.utils';

export function useDashboardStats(year: number = new Date().getFullYear()) {
  const params: DashboardStatsParams = { annee: year };
  const { data, isLoading, isError, error } = useDashboardStatsQuery(params);

  const chartData = useMemo(() => {
    if (!data) return [];
    return toMonthlyChartData(data, year);
  }, [data, year]);

  return { chartData, isLoading, isError, error };
}
