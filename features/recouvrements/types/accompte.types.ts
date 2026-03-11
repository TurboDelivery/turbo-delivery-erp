export interface IAccompte {
  id: string;
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  montant: number;
  dateAccompte: string;
  commentaire: string;
  statut?: string;
}

export interface IAccompteParams {
  page?: number;
  limit?: number;
  restaurantId?: string;
  debut?: Date;
  fin?: Date;
  statuts?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
