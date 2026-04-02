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
  createdAt: string;
  updatedAt: string;
}

export interface IChargeFixeParams {
  designation?: string;
  page?: number;
  size?: number;
  statut?: StatutChargeFixe;
}

export interface IWorkflowDecisionDtoFixe {
  commentaire?: string;
  par: string;
}
