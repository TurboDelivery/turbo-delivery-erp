export interface IFinanceResume {
  chiffreAffaire:number;
  totalTickets: number;
  totalDepenses: number;
  totalRevenus: number;
  totalInvestissements: number;
  totalFacturesEnCours: number;
}

export interface IFinanceResumeParams {
  debut?: Date;
  fin?: Date;
}
