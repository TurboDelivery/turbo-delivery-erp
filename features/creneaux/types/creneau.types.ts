export enum CreneauStatutJour {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  JUSTIFIE = 'JUSTIFIE',
  NON_INSCRIT = 'NON_INSCRIT',
  RETARD = 'RETARD',
}

export interface ICreneauJour {
  jour: string;       // "LUNDI", "MARDI", etc.
  date: string;       // ISO date "2026-03-23"
  statut: CreneauStatutJour;
  heureDebut?: string;
  heureFin?: string;
}

export interface ICreneauTurboy {
  id: string;
  nomComplet: string;
  avatar?: string;
  jours: ICreneauJour[];
  assiduite: number;   // 0-100 percentage
}

export interface ICreneauSemaine {
  debut: string;       // ISO date for week start
  fin: string;         // ISO date for week end
  turboys: ICreneauTurboy[];
}

export interface ICreneauStats {
  capaciteGlobale: number;
  tauxPresenceGlobal: number;
  retention: number;
  fideliteTurboys: number;
}

export interface IStatistiqueJour {
  jour: string;
  date: string;
  pourcentage: number;
  presents: number;
  total: number;
}

export interface ICreneauParams {
  page?: number;
  size?: number;
  semaine?: string;    // ISO date of week start
  search?: string;
}

export interface ICreneauAlerte {
  type: 'rupture_reseau' | 'predictive';
  message: string;
  details?: string;
  joursImpactes?: string[];
}
