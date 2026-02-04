import { useMemo } from 'react';
import { useDashboardStatsQuery } from '../queries/dashboard-stats.query';
import { DashboardStatsParams, ChartDataPoint, MonthlyStats } from '../types/dashboard.types';

const MONTH_NAMES = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

export function useDashboardStats(year: number = new Date().getFullYear()) {
    const params: DashboardStatsParams = { annee: year };
    const { data, isLoading, isError, error } = useDashboardStatsQuery(params);

    // Transformer les données du backend pour le graphique
    const chartData = useMemo(() => {
        if (!data || !data[year.toString()]) {
            return [];
        }

        const yearData = data[year.toString()];
        let cumulativeComptes = 0;

        return Object.keys(yearData)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((month) => {
                const monthNum = parseInt(month);
                const monthData: MonthlyStats = yearData[month];
                
                // Calculer les revenus (chiffre d'affaires)
                const revenus = monthData.chiffre_affaire.montant;
                
                // Calculer les dépenses
                const depenses = monthData.depenses.montant;
                
                // Calculer les recouvrements
                const recouvrements = monthData.recouvrements.montant;
                
                // Calculer les investissements
                const investissements = monthData.investissements.montant;
                
                // Calculer le cumul des comptes (recouvrements + investissements - dépenses)
                cumulativeComptes += recouvrements + investissements - depenses;
                
                return {
                    month: MONTH_NAMES[monthNum - 1],
                    revenus: revenus,
                    depenses: depenses,
                    recouvrements: recouvrements,
                    investissements: investissements,
                    comptes: cumulativeComptes,
                };
            });
    }, [data, year]);

    // Calculer les totaux annuels
    const yearlyTotals = useMemo(() => {
        if (!data || !data[year.toString()]) {
            return {
                totalRevenus: 0,
                totalDepenses: 0,
                totalRecouvrements: 0,
                totalInvestissements: 0,
                totalComptes: 0,
            };
        }

        const yearData = data[year.toString()];
        let totalRevenus = 0;
        let totalDepenses = 0;
        let totalRecouvrements = 0;
        let totalInvestissements = 0;

        Object.values(yearData).forEach((monthData) => {
            const data = monthData as MonthlyStats;
            totalRevenus += data.chiffre_affaire.montant;
            totalDepenses += data.depenses.montant;
            totalRecouvrements += data.recouvrements.montant;
            totalInvestissements += data.investissements.montant;
        });

        return {
            totalRevenus,
            totalDepenses,
            totalRecouvrements,
            totalInvestissements,
            totalComptes: totalRecouvrements + totalInvestissements - totalDepenses,
        };
    }, [data, year]);

    return {
        chartData,
        yearlyTotals,
        isLoading,
        isError,
        error,
        rawData: data,
    };
}
