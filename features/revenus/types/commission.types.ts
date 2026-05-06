export interface ICommission {
    id: string;
    commandeId: string;
    restaurantId: string;
    nomRestaurant: string;
    localisation: string;
    fraisLivraison: number;
    commission: number;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ICommissionParams {
    page?: number;
    limit?: number;
    search?: string;
    nomRestaurant?: string;
    createdAt?: string;
}
