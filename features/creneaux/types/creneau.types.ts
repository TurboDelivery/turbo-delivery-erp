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
  emploiId: string;
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

export interface IAnalyseMiniStats {
  tauxPresence: number;
  fiabilite: number;
  absencesMois: number;
}

export interface IAnalyseCapacite {
  pourcentage: number;
  inscrits: number;
  total: number;
  tauxConfirmation: number;
}

export interface IAnalyseFiabilite {
  pourcentage: number;
  gpsConfirme: number;
  total: number;
  absencesJustifiees: number;
}

export interface IAnalyseEcart {
  valeur: number;
  message: string;
}

export interface IAnalysePeriode {
  taux: number;
  absences: number;
  justifiees: number;
}

export interface IEvolutionMensuelle {
  mois: string;
  previsionnel: number;
  reel: number;
  ecart: number;
  tendance: 'up' | 'down';
}

export interface ICreneauAnalyseComparaison {
  miniStats: IAnalyseMiniStats;
  capacite: IAnalyseCapacite;
  fiabilite: IAnalyseFiabilite;
  ecartPrevisionRealite: IAnalyseEcart;
  creneaux: {
    matin: IAnalysePeriode;
    soir: IAnalysePeriode;
  };
  evolutionMensuelle: IEvolutionMensuelle[];
}

export interface ICreneauDashboardParams {
  page?: number;
  size?: number;
  debut?: string;
  search?: string;
}

export interface ICreneauDashboard {
  stats: ICreneauStats;
  turboys: {
    data: ICreneauTurboy[];
    page: number;
    pageCount: number;
    total: number;
  };
  statsJour: IStatistiqueJour[];
  alertes: ICreneauAlerte[];
}

export interface ICreneauTurboySimple {
  id: string;
  nomComplet: string;
  avatar?: string;
}

export interface ICreneauJourDetail {
  date: string;
  inscrits: number;
  presents: number;
  absents: number;
  tauxPresence: number;
  turboysPresents: ICreneauTurboySimple[];
  turboysAbsents: ICreneauTurboySimple[];
  analyseRapide: {
    resume: string;
    recommandation: string;
  };
}
