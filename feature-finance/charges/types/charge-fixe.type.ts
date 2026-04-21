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
  codeSysteme?: string | null;
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
  aDecaisser?: boolean;
}

export interface IWorkflowDecisionDtoFixe {
  commentaire?: string;
  par?: string;
  date?: string;
}

export interface IDetailMasseSalariale {
  employeeId: string;
  nomEmploye: string;
  email: string;
  poste: string;
  departement: string;
  salaireBrut: number;
  totalDeductionsPayees: number;
  totalDeductionsEnAttente: number;
  netAPayer: number;
  statut: string;
}

export interface IHistoriqueMasseSalariale {
  id: string;
  moisPaie: string;
  montantTotal: number;
  details: IDetailMasseSalariale[];
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
