// Dans recouvrement.types.ts
export interface IRecouvrement {
    id: string;
    montant: number;
    dateRecouvrement: string;
    preuve: string;
    factureId?: string;
    restaurantId: string;
    nomRestaurant: string;
}

export interface IRecouvrementParams {
    page?: number;
    size?: number;
    sort?: string;
    limit?: number;
    dateRecouvrement?: string;
    restaurantId?: string;
    nomRestaurant?: string;
    montant?: number;
    search?: string;
    debut?: string;
    fin?: string;
}