// Types de la page ENCOURS (restes à payer) — module Comptabilité.

export interface IEncoursStore {
  store: string;
  /** mois (1-12) → montant facturé. Mois absent = « — » à l'affichage (pas 0). */
  factureParMois: Record<string, number>;
  totalFacture: number;
  reste: number;
}

export interface IEncoursPartenaire {
  groupe: string;
  stores: IEncoursStore[];
  sousTotalFacture: number;
  deduction: number;
  sousTotalReste: number;
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
  deductions: IEncoursDeduction[];
  totalDeductions: number;
  dateGeneration: string;
}

export interface IEncoursParams {
  annee: number;
  mois?: number | null;
  partenaire?: string | null;
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
