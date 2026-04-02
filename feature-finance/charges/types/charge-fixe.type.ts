export type CyclePaiement = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';

export interface IChargeFixe {
  id: string;
  designation: string;
  categorie: {
    id: string;
    nomCategorie: string;
    description: string;
    totalDepense: number;
  };
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  automatique: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IChargeFixeParams {
  designation?: string;
  page?: number;
  size?: number;
}
