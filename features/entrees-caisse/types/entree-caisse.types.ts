export interface IEntreeCaisse {
  id: string;
  createdAt: string;
  updatedAt: string;
  libelle: string;
  montant: number;
  dateEntree: string;
  commentaire: string;
}

export interface IEntreeCaisseParams {
  debut?: string;
  fin?: string;
  restaurantId?: string;
}

export interface IEntreeCaissePaginatedParams {
  page?: number;
  size?: number;
  debut?: string;
  fin?: string;
}
