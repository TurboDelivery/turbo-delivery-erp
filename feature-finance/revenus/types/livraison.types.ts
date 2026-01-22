

export interface ILivraison{
    nomLivreur: string,
    commandeId: string,
    restaurantId: string,
    nomRestaurant: string,
    localisation: string,
    commission: number,
    totalAmount: number,
    fraisLivraison: number,
    refCommande: number,
    createdAt: string,
    updatedAt: string
}

export interface ILivraisonParams {
    page?: number;
    limit?: number;
    size?: number;
    search?: string;
    sort?: string;
    order?: string;
    nomLivreur?: string;
    nomRestaurant?: string;
    createdAt?: string;
    fraisLivraison?: number;
    dateLivraison?: string;
}
