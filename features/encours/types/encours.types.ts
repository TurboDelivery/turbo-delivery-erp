// Types de la page ENCOURS v3 (restes à payer) — détail facture par facture.

export type CycleRecouvrement = 'QUINZAINE' | 'HEBDOMADAIRE' | 'MENSUEL';

/** Une facture éditée (ligne de détail). */
export interface IEncoursFacture {
  /** Identifiant de la facture — ce à quoi une perte se rattache. */
  id?: string;
  mois: number; // 1-12
  periode: string; // libellé mois, ex. « Avril »
  libelle: string; // « Mois » | « Quinzaine 1/2 » | « Semaine N (dd–dd) » | plage réelle | « — »
  /** Bornes RÉELLES de la facture. Absentes sur les lignes « À venir ». */
  periodeDebut?: string | null;
  periodeFin?: string | null;
  code?: string | null;
  /**
   * Vrai quand cette ligne COMPLÈTE la précédente sur la même période : la commission
   * d'un couple frais/commission (RG-08). L'écran n'y répète pas la période, et les
   * compteurs ne la comptent pas comme une période de plus.
   */
  complement?: boolean;
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

/**
 * L'exposition GLOBALE sur les encours — ce que le bandeau de tête affiche.
 *
 * <p>Ces chiffres ne bougent avec AUCUN filtre, et c'est leur raison d'être :
 * un reste dû, un retard et un taux sont des STOCKS. Borner un stock sur une
 * période sans mouvement le met à zéro, et un zéro se lit comme une mesure.</p>
 */
export interface IEncoursGlobal {
  totalFacture: number;
  totalRestant: number;
  totalRetard: number;
  /** Déductions RÉELLEMENT appliquées, plafonnées au dû de chaque groupe. */
  totalDeductions: number;
  nbFacturesRetard: number;
  nbStoresRetard: number;
}

/** Un motif de perte, paramétrable côté serveur. */
export interface ICategoriePerte {
  code: string;
  libelle: string;
  exigePrecision: boolean;
  actif: boolean;
  ordre: number;
}

/**
 * Un montant qui ne sera jamais recouvré, rattaché à sa facture d'origine.
 *
 * <p>Une ligne n'est jamais supprimée : `annule` porte la trace de l'annulation,
 * avec son auteur, sa date et son motif. Une perte est un abandon de créance,
 * elle engage.</p>
 */
export interface IPerteVol {
  id: string;
  factureId: string;
  restaurantId: string;
  montant: number;
  categorieCode: string;
  precisionLibre?: string | null;
  commentaire?: string | null;
  creePar?: string | null;
  annule: boolean;
  annulePar?: string | null;
  annuleAt?: string | null;
  annuleMotif?: string | null;
  createdAt?: string;
}

export interface ICreerPerte {
  factureId: string;
  montant: number;
  categorieCode: string;
  precision?: string;
  commentaire?: string;
}

/** Une ligne de répartition : de quoi tracer une barre et l'étiqueter. */
export interface ILignePerteStat {
  cle: string;
  libelle: string;
  montant: number;
  nb: number;
}

export interface IPerteStatistiques {
  total: number;
  nbLignes: number;
  parCategorie: ILignePerteStat[];
  parPartenaire: ILignePerteStat[];
  parMois: ILignePerteStat[];
}
