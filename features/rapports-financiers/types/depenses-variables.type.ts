export interface IDepenseVariableParams {
  debut: Date;
  fin?: Date;
  page?: number;
  size?: number;
}

export interface IDepenseVariableCategorie {
  id: string;
  nomCategorie: string;
  description: string;
  totalDepense: number;
}

export interface IDepenseVariableItem {
  id: string;
  montant: number;
  description: string;
  typeDepense: string;
  periodicite: string | null;
  statut: string | null;
  dateDepense: string;
  categorie: IDepenseVariableCategorie;
  investissement: unknown | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDepensesVariablesResponse {
  content: IDepenseVariableItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
