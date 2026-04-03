export type CyclePaiement = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'| 'HEBDOMADAIRE';

export type StatutChargeVariable =
  | 'EN_ATTENTE_DGA'
  | 'VALIDE_DGA'
  | 'REJETE_DGA'
  | 'APPROUVE_DG'
  | 'REJETE_DG'
  | 'DECAISSE';

export interface IChargeVariable {
  id: string;
  designation: string;
  categorieId?: string;
  categorie?: {
    id: string;
    nomCategorie: string;
    description?: string;
    totalDepense?: number;
  };
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  automatique: boolean;
  statut: StatutChargeVariable;
  typeDepense: string;
  description?: string;
  justificatif?: string;
  creerPar?: string;
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

export interface IChargeVariableCreateDTO {
  designation: string;
  categorieId: string;
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  description?: string;
  justificatif?: string;
  creerPar?: string;
}

export interface IChargeVariableUpdateDTO {
  designation: string;
  categorieId: string;
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  description?: string;
  justificatif?: string;
}

export interface IChargeVariableParams {
  page?: number;
  size?: number;
  designation?: string;
  statut?: StatutChargeVariable;
  cyclePaiement?: CyclePaiement;
}

export interface IWorkflowDecisionDto {
  commentaire?: string;
  par: string;
}
