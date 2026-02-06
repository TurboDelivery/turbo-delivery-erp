export interface IMonthlyInvestissementData {
  date: string;
  montantInvestissement: number;
  montantRembourse: number;
}

export interface IInvestissementStats {
  totalInvestissement: number;
  totalRembourse: number;
  totalARembourserCeMois: number;
  montantRestant: number;
  monthlyData: IMonthlyInvestissementData[];
}

export interface IInvestissementStatsSummary {
  totalInvestissement: number;
  totalRembourse: number;
  totalARembourserCeMois: number;
  montantRestant: number;
}

export interface IInvestissementStatsParams {
  debut?: Date;
  fin?: Date;
}