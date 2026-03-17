export interface IDashboardStatsResponse {
  partenaireActif: number;
  turboys: number;
  turboysJournalier: number;
  turboysIndependant: number;
  personnel: number;
  utilisateurs: number;
}

export interface IPersonnelStatsParams {
  debut?: Date;
  fin?: Date;
}