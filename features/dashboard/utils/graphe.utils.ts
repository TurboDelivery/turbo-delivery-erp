import { ChartDataPoint, MonthlyStats, YearlyStats } from '@/feature-finance/dashboard/types/dashboard.types';

export const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'] as const;

const EMPTY_MONTHLY_STATS: MonthlyStats = {
  depenses: { count: 0, montant: 0 },
  recouvrements: { count: 0, montant: 0 },
  chiffre_affaire: { count: 0, montant: 0 },
  investissements: { count: 0, montant: 0 },
  factures_validees: { count: 0, montant: 0 },
  factures_non_validees: { count: 0, montant: 0 },
};

// Retourne les stats d'un mois precis; si absent, retourne des stats vides.
export function getMonthlyStatsByYearMonth(yearlyStats: YearlyStats, year: number | string, month: number): MonthlyStats {
  const yearKey = String(year);
  const monthKey = String(month);

  return yearlyStats?.[yearKey]?.[monthKey] ?? EMPTY_MONTHLY_STATS;
}

export function getChartDataPointByMonth(chartData: ChartDataPoint[], month: number): ChartDataPoint | null {
  if (month < 1 || month > 12) {
    return null;
  }

  const monthLabel = MONTH_LABELS[month - 1];
  return chartData.find((item) => item.month === monthLabel) ?? null;
}

// Transforme les YearlyStats en serie de 12 points mensuels utilisables par les graphes.
export function toMonthlyChartData(yearlyStats: YearlyStats, year: number | string): ChartDataPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthStats = getMonthlyStatsByYearMonth(yearlyStats, year, month);

    return {
      month: MONTH_LABELS[index],
      revenus: monthStats.chiffre_affaire.montant,
      depenses: monthStats.depenses.montant,
      recouvrements: monthStats.recouvrements.montant,
      investissements: monthStats.investissements.montant,
      comptes: monthStats.factures_validees.montant + monthStats.factures_non_validees.montant,
    };
  });
}

