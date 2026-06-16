import { ITurboy, TurboyType } from '@/features/turboys/types/turboys.types';

/**
 * Types du module Comptes & habilitations (M1, CDC v1.5) côté ERP.
 * Reflètent les DTO/VM du back-office `/api/erp/livreur/*`.
 */

export type PieceStatut = 'A_VERIFIER' | 'CONFORME' | 'REFUSE';
export type PieceCible = 'CNI' | 'FICHE' | 'CONTRAT';
export type Rattachement = 'SITE_PARTNER' | 'BIRD';

/** RG-07 — validation atomique (type d'emploi + rattachement). */
export interface ValiderCompteDTO {
  typeLivreur: TurboyType;
  rattachement: Rattachement;
  sitePartnerId?: string | null;
}

/** RG-05 — changement de statut d'une pièce. */
export interface ChangerStatutPieceDTO {
  piece: PieceCible;
  statut: PieceStatut;
  motif?: string | null;
}

/** Clé d'activation émise — le `code` en clair n'est présent qu'ici (one-time). */
export interface EmissionCle {
  cleId: string;
  code: string;
  codeApercu: string;
  expireLe: string;
}

/** Résultat de validation : profil mis à jour + clé émise (code one-time). */
export interface ValidationCompteVm {
  livreur: ITurboy;
  cleId: string;
  code: string;
  codeApercu: string;
  expireLe: string;
}

/** Vue ERP d'une clé (historique) — jamais le code en clair. */
export interface CleActivationVm {
  id: string;
  codeApercu: string | null;
  statut: string;
  emiseLe: string | null;
  expireLe: string | null;
  consommeeLe: string | null;
  revoqueeLe: string | null;
  motifRevocation: string | null;
}

/** Vue ERP d'un événement d'historisation (RG-11). */
export interface LivreurEvenementVm {
  id: string;
  type: string;
  auteurId: string | null;
  auteurRole: string | null;
  horodatage: string | null;
  payloadJson: string | null;
}

/** Une variation de cote de fiabilité (RG-29). */
export interface CoteHistorique {
  id: string;
  delta: number;
  coteAvant: number;
  coteApres: number;
  raison: string | null;
  dateRef: string | null;
  horodatage: string | null;
}

/** Cote courante + historique. */
export interface CoteVm {
  cote: number;
  historique: CoteHistorique[];
}
