export interface IFinanceResume {
  chiffreAffaire:number;
  totalTickets: number;
  totalDepenses: number;
  totalRevenus: number;
  totalInvestissements: number;
  totalFacturesEnCours: number;
  totalFacturesEnCoursCumule: number;
  totalDepensesCumule: number;
  margeCumule: number;
}

export interface IFinanceResumeParams {
  debut?: Date;
  fin?: Date;
}
