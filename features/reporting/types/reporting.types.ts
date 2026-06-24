// Module M6 — Reporting & historisation (CDC v1.5 RG-11/21). Miroir des VMs main-backend
// (/api/erp/journal-activite et /api/erp/gestion-creneau/{id}/rapport).

export type ModuleActivite = 'COMPTE' | 'CRENEAU' | 'POINTAGE' | 'GAIN' | 'COMMUNICATION' | 'SUIVI';
export type AuteurType = 'LIVREUR' | 'AGENT' | 'SYSTEME';

/** Une ligne du journal transverse (JournalActiviteVm). */
export interface IJournalActivite {
  id: string;
  occurredAt: string;
  module: ModuleActivite;
  action: string;
  libelle: string;
  livreurId: string | null;
  auteurType: AuteurType;
  auteurNom: string | null;
  cibleType: string | null;
  cibleId: string | null;
  metadata: string | null;
}

export interface IModuleCount {
  module: string;
  count: number;
}

export interface IJournalFiltre {
  module: ModuleActivite[];
  debut: string | null; // yyyy-MM-dd
  fin: string | null;
  keysearch: string;
  page: number;
}

// ─── Rapport de présence par livreur (RapportPresenceLivreurVm) ────────────────

export interface IRapportSignal {
  heure: string | null;
  statut: string | null;
  conforme: boolean | null;
  distanceMetres: number | null;
}

export interface IRapportJour {
  date: string;
  jour: string | null;
  statutJour: string | null;
  montee: IRapportSignal | null;
  intermediaire: IRapportSignal | null;
  intermediaire2: IRapportSignal | null;
  fin: IRapportSignal | null;
  absenceJustifiee: boolean | null;
  absenceMotif: string | null;
  penaliteFcfa: number | null;
}

export interface IRapportSynthese {
  joursActifs: number;
  presents: number;
  absents: number;
  retards: number;
  justifies: number;
  tauxAssiduite: number;
  totalPenalitesFcfa: number;
}

export interface IRapportPresence {
  livreurId: string;
  nomComplet: string | null;
  cote: number | null;
  debut: string;
  fin: string;
  synthese: IRapportSynthese;
  jours: IRapportJour[];
}

export const MODULE_LABELS: Record<ModuleActivite, string> = {
  COMPTE: 'Comptes',
  CRENEAU: 'Créneaux',
  POINTAGE: 'Pointage',
  GAIN: 'Gains',
  COMMUNICATION: 'Communication',
  SUIVI: 'Suivi',
};
