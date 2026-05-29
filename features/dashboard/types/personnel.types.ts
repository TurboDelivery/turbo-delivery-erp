export interface IDashboardStatsResponse {
  partenaireActif: number;
  turboys: number;
  turboysJournalier: number;
  turboysIndependant: number;
  personnel: number;
  utilisateurs: number;
  // V54 (2026-05) — Compteur de la nouvelle population SUPERVISEUR_LIVREUR
  // (aligné sur la note de cadrage DGA du 28/05). Optionnel pour rester
  // rétro-compat si l'API renvoie un payload d'avant V54.
  turboysSuperviseurLivreur?: number;
}

export interface IPersonnelStatsParams {
  debut?: Date;
  fin?: Date;
}