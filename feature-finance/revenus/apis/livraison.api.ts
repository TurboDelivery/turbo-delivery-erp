import { SearchParams } from "ak-api-http";
import { api } from "@/lib/api";
import { ILivraison, ILivraisonParams } from "../types/livraison.types";

export interface ILivraisonAPI {
    obtenirTousLivraisons(params: ILivraisonParams): Promise<ILivraison[]>;
    obtenirLivraison(id: string): Promise<ILivraison>;
}

export const livraisonAPI: ILivraisonAPI = {
    async obtenirTousLivraisons(params: ILivraisonParams): Promise<ILivraison[]> {
        return await api.request<ILivraison[]>({
            endpoint: `/finance/commandes/commissions`,
            method: "GET",
            searchParams: params as SearchParams,
        });

    },
    async obtenirLivraison(id: string): Promise<ILivraison> {
        return await api.request<ILivraison>({
            endpoint: `/finance/commandes/commissions/${id}`,
            method: "GET",
        });
    },

}


