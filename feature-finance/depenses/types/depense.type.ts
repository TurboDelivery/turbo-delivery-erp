import { ICategorieDepense } from "./categorie-depense.type";

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
}

export interface IDepenseStatsResponse {
  global: {
    totalExpenses: number;
    totalAmount: number;
    totalCategories: number;
    activeCategories: number;
    categoriesWithExpenses: number;
    categoriesWithoutExpenses: number;
  };

  byCategory: {
    categorieId: string;
    nomCategorie: string;
    description: string;
    totalAmount: number;
    percentage: string; // ex: "66.67"
  }[];

  topCategories: {
    byExpenseCount: {
      categoryId: string;
      categoryName: string;
      categoryDescription: string;
      expenseCount: number;
      totalAmount: number;
      percentage: string;
    }[];

    byTotalAmount: {
      categoryId: string;
      categoryName: string;
      categoryDescription: string;
      isActive: boolean;
      expenseCount: number;
      totalAmount: number;
      percentage: string;
    }[];
  };
}


