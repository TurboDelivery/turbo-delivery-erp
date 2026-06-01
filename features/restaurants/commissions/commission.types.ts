/** Historisation des commissions partenaires (SPEC) — types frontend. */

export type TypeCommissionVersion = 'POURCENTAGE' | 'MONTANT_FIXE' | 'AUCUNE';

export type SourceCommissionVersion = 'MANUEL' | 'RETROACTIF' | 'MIGRATION';

export interface ICommissionVersion {
  id: string;
  zoneId: string | null;
  type: TypeCommissionVersion;
  valeur: number;
  seuil: number | null;
  dateDebutEffet: string; // ISO yyyy-MM-dd
  dateFinEffet: string | null; // null = version courante
  courante: boolean;
  auteurId: string | null;
  motif: string | null;
  source: SourceCommissionVersion;
  createdAt: string;
}

export interface IModifierCommissionPayload {
  dateEffet?: string; // ISO yyyy-MM-dd ; défaut = aujourd'hui côté backend
  type: TypeCommissionVersion;
  valeur: number;
  seuil?: number | null;
  zoneId?: string | null; // null = niveau partenaire
  motif?: string | null;
  retroactif?: boolean; // recalcule les courses non recouvrées depuis dateEffet
}

export interface IAppliquerCommissionResponse {
  versionId: string;
  coursesRecalculees: number;
}
