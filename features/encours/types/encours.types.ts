// Types de la page ENCOURS (restes à payer) — module Comptabilité.

export type CycleRecouvrement = 'QUINZAINE' | 'MENSUEL';

export interface IEncoursStore {
  store: string;
  /** mois (1-12) → montant facturé. Mois absent = « — » à l'affichage (pas 0). */
  factureParMois: Record<string, number>;
  resteParMois?: Record<string, number>;
  totalFacture: number;
  reste: number;
}

export interface IEncoursPartenaire {
  groupe: string;
  /** Cadence de facturation : "QUINZAINE" ou "MENSUEL" (§4 filtre Cycle). */
  cycle: CycleRecouvrement;
  stores: IEncoursStore[];
  sousTotalFacture: number;
  deduction: number;
  sousTotalReste: number;
}

/** Point de vente (store) d'un partenaire — pour le filtre multi-sélection (§4). */
export interface IStoreOption {
  id: string;
  nom: string;
}

export interface IEncoursDeduction {
  partenaire: string;
  motif: string | null;
  montant: number;
}

export interface IEncoursReleve {
  annee: number;
  mois: number | null;
  partenaireFiltre: string | null;
  moisColonnes: number[];
  partenaires: IEncoursPartenaire[];
  totalFacture: number;
  totalReste: number;
  /** Totaux par mois (clé = numéro de mois "1".."12") pour les mini-graphes. */
  factureParMois: Record<string, number>;
  resteParMois: Record<string, number>;
  nbPartenaires: number;
  nbStores: number;
  deductions: IEncoursDeduction[];
  totalDeductions: number;
  dateGeneration: string;
}

export interface IEncoursParams {
  annee: number;
  mois?: number | null;
  partenaire?: string | null;
  /** "MENSUEL" | "QUINZAINE" | null = tous. */
  cycle?: string | null;
  /** ids de stores (multi-sélection) ; vide = tous. */
  stores?: string[] | null;
}

// Déductions / avances par partenaire (CRUD §6).
export interface IDeductionPartenaire {
  id: string;
  groupePartenaire: string;
  montant: number;
  motif: string | null;
  annee: number;
  dateDeduction: string | null;
}

export interface ICreateDeductionPartenaire {
  groupePartenaire: string;
  montant: number;
  motif?: string | null;
  annee: number;
  dateDeduction?: string | null;
}
