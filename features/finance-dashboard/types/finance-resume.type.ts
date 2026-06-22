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
  chiffreAffaireCumule: number;
}

export interface IFinanceResumeParams {
  debut?: Date;
  fin?: Date;
}
