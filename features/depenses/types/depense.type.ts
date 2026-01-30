export type IDepense = {
  id: string
  libelle: string
  montant: number
  description?: string
  dateDepense: string
  categorie: {
    id: string
    nomCategorie: string
    description: string
  }
  createdAt: string
  updatedAt: string
}

export interface IDepensesParams {
  page?: number;
  limit?: number;
  categorie?: string;
  montant?: number;
  dateDepense?: string;
  debut?: Date;
  fin?: Date;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface IDepenseStats {
  nombre_categories: number;
  montant_total: number;
  nombre_depenses: number;
}

export interface IDepenseStatsParams {
  debut?: Date;
  fin?: Date;
}
