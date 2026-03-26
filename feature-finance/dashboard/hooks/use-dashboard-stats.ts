import { useMemo } from 'react';
import { useDashboardStatsQuery } from '../queries/dashboard-stats.query';
import { DashboardStatsParams } from '../types/dashboard.types';
import { getChartDataPointByMonth, getMonthlyStatsByYearMonth, toMonthlyChartData } from '@/features/dashboard/utils/graphe.utils';

export function useDashboardStats(year: number = new Date().getFullYear()) {
    const params: DashboardStatsParams = { annee: year };
    const { data, isLoading, isError, error } = useDashboardStatsQuery(params);

    const chartData = useMemo(() => {
        if (!data) {
            return [];
        }

        return toMonthlyChartData(data, year);
    }, [data, year]);

    const yearlyTotals = useMemo(() => {
        const totalRevenus = chartData.reduce((sum, item) => sum + (item.revenus || 0), 0);
        const totalDepenses = chartData.reduce((sum, item) => sum + (item.depenses || 0), 0);
        const totalRecouvrements = chartData.reduce((sum, item) => sum + (item.recouvrements || 0), 0);
        const totalInvestissements = chartData.reduce((sum, item) => sum + (item.investissements || 0), 0);
        const totalComptes = chartData.reduce((sum, item) => sum + (item.comptes || 0), 0);

        return {
            totalRevenus,
            totalDepenses,
            totalRecouvrements,
            totalInvestissements,
            totalComptes,
        };
    }, [chartData]);

    const getMonthStats = (month: number) => {
        if (!data) {
            return null;
        }

        return getMonthlyStatsByYearMonth(data, year, month);
    };

    const getMonthChartData = (month: number) => {
        return getChartDataPointByMonth(chartData, month);
    };

    return {
        chartData,
        yearlyTotals,
        isLoading,
        isError,
        error,
        getMonthStats,
        getMonthChartData,
        rawData: data,
    };
}
