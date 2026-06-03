// Rentabilité temps réel (§8) — réponse de GET /api/finance/rentabilite.

export interface IRentabilite {
  dateArret: string; // YYYY-MM-DD
  nbJours: number;
  joursEcoules: number;
  chargesFixesMensuelles: number;
  coutJournalier: number;
  fixeProrata: number;
  variableReel: number;
  totalCumule: number;
  caCumule: number;
  profit: number;
  marge: boolean; // true = marge (≥0) ; false = déficit
}
