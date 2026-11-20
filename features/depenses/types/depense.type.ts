export type IDepense = {
  id: string;
  libelle: string;
  montant: number;
  description?: string;
  justificatif?: string;
  dateDepense: string;
  typeDepense: string;
  sourcePaiement?: string;
  creerPar?: string;
  statut: string;
  categorie: {
    id: string;
    nomCategorie: string;
    description: string;
  };
  investissement?: {
    id: string;
    nomInvestisseur: string;
    montant: number;
  };
  createdAt: string;
  updatedAt: string;
};

export interface IDepensesParams {
  page?: number;
  limit?: number;
  categorie?: string;
  categoriesDepense?: string[]; // Ajouté pour supporter plusieurs catégories
  montant?: number;
  typeDepense?: string;
  dateDepense?: string;
  debut?: Date;
  fin?: Date;
  statut?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Les mesures de la période, telles que /finance/depenses/stats les rend.
 *
 * Les six derniers champs n'existaient NI au front NI au backend : le minimum et le
 * maximum n'étaient calculés nulle part, et le couple payé / reste à payer n'était servi
 * que par un endpoint à part qui filtre `type_depense = 'FIXE'` et ne couvre donc pas la
 * période. Ils arrivent maintenant de la même requête que le total, donc sous les mêmes
 * filtres que la liste.
 *
 * ⚠ « Payé » vaut PAID ou DECAISSE, « restant » tout le reste, NULL compris. C'est une
 * hypothèse : le code existant ne la tranchait pas, il ignorait A_DECAISSER et DECAISSE.
 */
export interface IDepenseStats {
  nombre_categories: number;
  montant_total: number;
  nombre_depenses: number;
  montant_min?: number;
  montant_max?: number;
  montant_paye?: number;
  nombre_payees?: number;
  montant_restant?: number;
  nombre_restantes?: number;
}

export interface IDepenseStatsParams {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[]; // ✅ AJOUTÉ: Supporter le filtrage par catégories pour les stats
  // Les mêmes filtres que la liste : sans eux, le total décrirait autre chose que les
  // lignes affichées.
  typeDepense?: string;
  statut?: string;
}

export interface IDepenseSummary {
  totalRecurrentes: number;
  totalNonRecurrentes: number;
}

export interface IDepenseSummaryParams {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[]; // ✅ AJOUTÉ: Supporter le filtrage par catégories pour le summary
}
