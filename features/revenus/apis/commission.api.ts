import { SearchParams } from "ak-api-http";
import { api } from "@/lib/api";
import { ICommission, ICommissionParams } from "../types/commission.types";


export interface ICommissionAPI {
    obtenirTousCommissionsPourcentage(params: ICommissionParams): Promise<ICommission[]>;
    obtenirCommission(id: string): Promise<ICommission>;
    // commission fixe
    obtenirTousCommissionsFixe(params: ICommissionParams): Promise<ICommission[]>;
}

// commission pourcentage
export const commissionAPI: ICommissionAPI = {
    async obtenirTousCommissionsPourcentage(params: ICommissionParams): Promise<ICommission[]> {
        return await api.request<ICommission[]>({
            endpoint: `/finance/commandes/commissions`,
            method: "GET",
            searchParams: { ...params, typeCommission: "POURCENTAGE" } as SearchParams,
        });
    },

    async obtenirCommission(id: string): Promise<ICommission> {
        return await api.request<ICommission>({
            endpoint: `/finance/commandes/commissions/${id}`,
            method: "GET",
        });
    },

    // commission taux fixe
    async obtenirTousCommissionsFixe(params: ICommissionParams): Promise<ICommission[]> {
        return await api.request<ICommission[]>({
            endpoint: `/finance/commandes/commissions`,
            method: "GET",
            searchParams: { ...params, typeCommission: "FIXE" } as SearchParams,
        });
    },



}


