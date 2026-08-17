// Types de la page ENCOURS v3 (restes à payer) — détail facture par facture.

export type CycleRecouvrement = 'QUINZAINE' | 'HEBDOMADAIRE' | 'MENSUEL';

/** Une facture éditée (ligne de détail). */
export interface IEncoursFacture {
  mois: number; // 1-12
  periode: string; // libellé mois, ex. « Avril »
  libelle: string; // « Mois » | « Quinzaine 1/2 » | « Semaine N (dd–dd) » | plage réelle | « — »
  /** Bornes RÉELLES de la facture. Absentes sur les lignes « À venir ». */
  periodeDebut?: string | null;
  periodeFin?: string | null;
  code?: string | null;
  /** §5.1 — « Cycle » ou « Plage de dates ». */
  mode?: string | null;
  /** §5.1 — « Globale », « Frais de livraison » ou « Commission ». */
  objet?: string | null;
  origine?: string | null;
  /** §5.1 — la référence croisée du couple frais/commission (RG-08). */
  factureLieeCode?: string | null;
  totalAPayer: number | null;
  acompte: number | null; // déjà recouvré
  solde: number | null; // reste à payer
  statut: string; // Payé | Partiel | En retard | En cours | À venir
}

export interface IEncoursStore {
  store: string;
  factures: IEncoursFacture[];
  totalFacture: number;
  reste: number;
}

export interface IEncoursPartenaire {
  groupe: string;
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

export interface IEncoursReleve {
  annee: number;
  mois: number | null;
  partenaireFiltre: string | null;
  partenaires: IEncoursPartenaire[];
  totalFacture: number;
  totalReste: number;
  /** Totaux par mois (clé = numéro de mois "1".."12") pour les mini-graphes. */
  moisColonnes: number[];
  factureParMois: Record<string, number>;
  resteParMois: Record<string, number>;
  nbPartenaires: number;
  nbStores: number;
  nbFactures: number;
  deductions: IEncoursDeduction[];
  totalDeductions: number;
  dateGeneration: string;
}

export interface IEncoursParams {
  annee: number;
  mois?: number | null;
  partenaire?: string | null;
  cycle?: string | null;
  stores?: string[] | null;
}

// Déductions / avances par partenaire (CRUD §7).
export interface IEncoursDeduction {
  partenaire: string;
  motif: string | null;
  montant: number;
}

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
