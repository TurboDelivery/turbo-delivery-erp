export type HistoriqueChargeType = 'FIXE' | 'VARIABLE';

export interface IHistoriqueCharge {
  id: string;
  type: HistoriqueChargeType;
  designation: string;
  categorie?: {
    id: string;
    nomCategorie: string;
    description?: string;
    totalDepense?: number;
  };
  montant: number;
  statut: string;
  creerPar?: string | null;
  validePar?: string | null;
  dateValidationDGA?: string | null;
  commentaireDGA?: string | null;
  approuvePar?: string | null;
  dateApprobationDG?: string | null;
  commentaireDG?: string | null;
  dateDecaissement?: string | null;
  dateRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IHistoriqueChargeParams {
  page?: number;
  size?: number;
  debut?: string;
  fin?: string;
  role?: 'DGA' | 'DG' | 'COMPTABLE';
}
