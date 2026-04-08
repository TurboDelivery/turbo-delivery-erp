export type CyclePaiement = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';

export type StatutChargeFixe =
  | 'PENDING'
  | 'EN_ATTENTE_DGA'
  | 'VALIDE_DGA'
  | 'REJETE_DGA'
  | 'APPROUVE_DG'
  | 'REJETE_DG'
  | 'DECAISSE'
  | 'PAID';

export interface IChargeFixe {
  id: string;
  designation: string;
  categorieId?: string;
  categorie?: {
    id: string;
    nomCategorie: string;
    description: string;
    totalDepense: number;
  };
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  automatique: boolean;
  statut: StatutChargeFixe;
  creerPar?: string | null;
  validePar?: string | null;
  dateValidationDGA?: string | null;
  commentaireDGA?: string | null;
  approuvePar?: string | null;
  dateApprobationDG?: string | null;
  commentaireDG?: string | null;
  dateDecaissement?: string | null;
  enable: boolean;
  tauxJournalier: number;
  montantConsomme: number;
  dateEcheance: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChargeFixeParams {
  designation?: string;
  page?: number;
  size?: number;
  statut?: StatutChargeFixe;
  debut?: string;
  fin?: string;
  role?: string;
}

export interface IWorkflowDecisionDtoFixe {
  commentaire?: string;
  par: string;
}

export interface IChargeStats {
  totalMensuel: number;
  chargesFixesAuProrata: number;
  chargesActives: number;
  sommeDepensesVariables: number;
  nombreDepensesVariables: number;
  totalChargesADate: number;
  pointMortDuJour: number;
  pointMortQuotidien: number;
}
