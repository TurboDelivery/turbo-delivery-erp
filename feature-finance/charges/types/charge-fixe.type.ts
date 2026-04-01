export type CyclePaiement = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';

export interface IChargeFixe {
  id: string;
  designation: string;
  categorieId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IChargeFixeCreateDTO {
  designation: string;
  categorieId: string;
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  automatique: boolean;
}

export interface IChargeFixeUpdateDTO {
  designation: string;
  categorieId: string;
  cyclePaiement: CyclePaiement;
  montant: number;
  echeanceJour: number;
  automatique: boolean;
}

export interface IChargeFixeParams {
  page?: number;
  size?: number;
  designation?: string;
}
