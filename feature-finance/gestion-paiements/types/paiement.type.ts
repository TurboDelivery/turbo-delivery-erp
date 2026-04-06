export type StatutPaiement = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE';

export interface IPaiement {
  id: string;
  designation: string;
  categorieId?: string;
  categorie?: {
    id: string;
    nomCategorie: string;
  };
  montant: number;
  statut: StatutPaiement;
  progression: number; // 0-4 steps
  mois: string; // "2026-04"
  datePaiement?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPaiementParams {
  page?: number;
  size?: number;
  mois?: string;
  statut?: StatutPaiement;
}

export interface IPaiementStats {
  totalAPayer: number;
  enAttente: number;
  enCours: number;
  termines: number;
}
