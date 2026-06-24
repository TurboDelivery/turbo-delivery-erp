// Pointages détaillés d'un livreur (M3) — forme du VM backend
// LEmploiTempsRecentVm renvoyé par GET /api/erp/gestion-creneau/{livreurId}.

export type StatutSignalement = 'ON_TIME' | 'LATE' | 'MISSED';

/** Un signalement GPS (montée / relance 1 / relance 2 / fin). */
export interface ISignalementPointage {
  pointeAt: string | null; // ISO datetime du pointage
  statut: StatutSignalement | null;
  latitude: number | null;
  longitude: number | null;
  distanceMetres: number | null; // distance au site assigné (> rayon = hors-zone)
}

/** Un jour de service avec ses 4 signalements (RG-16) + statut. */
export interface IJourPointage {
  jour: string; // LUNDI, MARDI…
  date: string; // ISO date
  debut: string | null; // heure prévue de début (LocalTime)
  fin: string | null; // heure prévue de fin (LocalTime)
  actif: boolean;
  startSignalement: ISignalementPointage | null; // Montée
  midSignalement: ISignalementPointage | null; // Relance 1 (+1/3)
  mid2Signalement: ISignalementPointage | null; // Relance 2 (+2/3)
  endSignalement: ISignalementPointage | null; // Fin de service
  statutJour: string | null; // PRESENT | ABSENT | RETARD | JUSTIFIE | NON_INSCRIT
  penaliteFcfa: number | null;
  absenceJustifiee: boolean | null;
  absenceMotif: string | null;
}

/** Une semaine d'emploi du temps. */
export interface IEmploiPointage {
  id: string;
  debut: string; // début de semaine (date)
  fin: string; // fin de semaine (date)
  semainePassee: boolean;
  jours: IJourPointage[];
}

/** Ligne aplatie (1 jour) pour la table. */
export interface IPointageRow extends IJourPointage {
  emploiId: string;
}
