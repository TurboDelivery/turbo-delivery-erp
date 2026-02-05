export interface IRestaurantRecouvrement {
  id: string;
  nomRestaurant: string;
  totalCommande: number;
  totalCommission: number;
  totalFraisLivraisons: number;
  totalFacture: number;
}

export interface IRestaurantRecouvrementSearchParams {
  debut?: Date;
  fin?: Date;
  restaurantId?: string;
  page?: number;
  limit?: number;
  periode?: 'JOUR' | 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'SEMESTRE' | 'ANNEE';
}