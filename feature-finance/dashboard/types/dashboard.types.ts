export interface MonthlyStats {
  depenses: {
    count: number;
    montant: number;
  };
  recouvrements: {
    count: number;
    montant: number;
  };
  chiffre_affaire: {
    count: number;
    montant: number;
  };
  investissements: {
    count: number;
    montant: number;
  };
}

export interface YearlyStats {
  [year: string]: {
    [month: string]: MonthlyStats;
  };
}

export interface ChartDataPoint {
  month: string;
  revenus: number;
  depenses: number;
  recouvrements: number;
  investissements: number;
  comptes: number;
}

export interface DashboardStatsParams {
  annee: number;
}
