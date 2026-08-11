/**
 * Facturation par plage de dates (cahier DOSSOU du 10/08/2026).
 * Backend : main-backend, /api/erp/facturation.
 */

/** Les six cycles de l'écran unique (RG-03). Les quatre premiers existaient déjà. */
export const CYCLES_FACTURATION = [
  'QUOTIDIEN',
  'HEBDOMADAIRE',
  'QUINZAINE',
  'MENSUEL',
  'PLAGE_DATES',
  'AU_CHOIX',
] as const;

export type CycleFacturation = (typeof CYCLES_FACTURATION)[number];

export const LIBELLE_CYCLE: Record<CycleFacturation, string> = {
  QUOTIDIEN: 'Journalier',
  HEBDOMADAIRE: 'Hebdomadaire (créneau)',
  QUINZAINE: 'Quinzaine',
  MENSUEL: 'Mensuel',
  PLAGE_DATES: 'Plage de dates',
  AU_CHOIX: 'Au choix à chaque facture',
};

export const OBJETS_FACTURATION = ['GLOBALE', 'FRAIS_UNIQUEMENT', 'COMMISSION_UNIQUEMENT'] as const;

export type ObjetFacturation = (typeof OBJETS_FACTURATION)[number];

export const LIBELLE_OBJET: Record<ObjetFacturation, string> = {
  GLOBALE: 'Frais de livraison + commission',
  FRAIS_UNIQUEMENT: 'Frais de livraison uniquement',
  COMMISSION_UNIQUEMENT: 'Commission uniquement',
};

export const LIBELLE_COMPOSANTE: Record<string, string> = {
  GLOBALE: 'Facture globale',
  FRAIS: 'Frais de livraison',
  COMMISSION: 'Commission',
};

export interface IConflitFacture {
  id: string;
  code: string;
  type: string;
  composante: string;
  origine: string;
  periodeDebut: string;
  periodeFin: string;
  montant: number;
  statut: string | null;
  financeWorkflowStatus: string | null;
}

export interface IApercuPlage {
  restaurantId: string;
  nomEtablissement: string;
  debut: string;
  fin: string;
  nombreCourses: number;
  fraisLivraison: number;
  commission: number;
  total: number;
  objetFacturation: ObjetFacturation;
  /** Les factures que la validation va créer, dans l'ordre. Deux si RG-08 s'applique. */
  composantes: string[];
  conflits: IConflitFacture[];
  generable: boolean;
}

export interface IFactureGeneree {
  id: string;
  code: string;
  composante: string;
  origine: string;
  periodeDebut: string;
  periodeFin: string;
  montant: number;
  factureLieeId: string | null;
}

export interface IGenerationPlageDto {
  restaurantId: string;
  debut: string;
  fin: string;
  /** Référence de la facture papier, pour une reprise hors ERP. */
  reference?: string;
}

export interface IConfigurationPartenaire {
  restaurantId: string;
  nomEtablissement: string;
  /** Le cycle d'avant cet écran (method_recouvrement). */
  cycleHistorique: string | null;
  /** Le choix fait ici, null tant que personne n'y a touché. */
  cycleChoisi: CycleFacturation | null;
  /** Celui qui pilote réellement la facturation. */
  cycleEffectif: string | null;
  objetFacturation: ObjetFacturation;
  /** Vrai tant que le partenaire fonctionne exactement comme avant (RG-07). */
  surCycleParDefaut: boolean;
  actif: boolean;
}

export interface IConfigurationFacturationDto {
  cycleFacturation: CycleFacturation | null;
  objetFacturation: ObjetFacturation | null;
}

export interface IApercuSuppression {
  factureId: string;
  code: string;
  composante: string;
  origine: string;
  periodeDebut: string;
  periodeFin: string;
  montant: number;
  dejaRecouvre: number;
  factureLieeId: string | null;
  factureLieeCode: string | null;
  factureLieeComposante: string | null;
  factureLieeMontant: number | null;
}
