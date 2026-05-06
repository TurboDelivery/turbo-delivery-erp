import { IRecouvrement } from "./recouvrement.types";


export interface IFacture {
    id: string,
    nomRestaurant: string,
    totalCommande: number,
    totalFraisLivraisons: number,
    totalCommission: number,
    restaurantId: string,
    recouvrement: IRecouvrement[]
}

export interface IFactureParams {
    id?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
    limit?: number;
    nomRestaurant?: string;
}
