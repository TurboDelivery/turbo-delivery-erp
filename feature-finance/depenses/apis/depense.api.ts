import { DepenseCreateDTO, DepenseUpdateDTO } from "../schemas/depense.schema";
import { SearchParams } from "ak-api-http";
import { api } from "@/lib/api";
import { IDepense, IDepensesParams } from "../types/depense.type";


export interface IDepenseAPI {
    obtenirTousDepenses(params: IDepensesParams): Promise<IDepense[]>;
    obtenirDepense(id: string): Promise<IDepense>;
    ajouterDepense(data: DepenseCreateDTO): Promise<IDepense>;
    modifierDepense(id: string, data: DepenseUpdateDTO): Promise<IDepense>;
    supprimerDepense(id: string): Promise<IDepense>;
    // obtenirStatsDepenses(): Promise<IDepenseStatsResponse>;
}

export const depenseAPI: IDepenseAPI = {
    async obtenirTousDepenses(params: IDepensesParams): Promise<IDepense[]> {
        return await api.request<IDepense[]>({
            endpoint: `/finance/depenses`,
            method: "GET",
            searchParams: params as SearchParams,
        });
    },

    async obtenirDepense(id: string): Promise<IDepense> {
        return await api.request<IDepense>({
            endpoint: `/finance/depenses/${id}`,
            method: "GET",
        });
    },

    ajouterDepense(data: DepenseCreateDTO): Promise<IDepense> {
        return api.request<IDepense>({
            endpoint: `/finance/depenses`,
            method: "POST",
            data,
        });
    },

    modifierDepense(id: string, data: DepenseUpdateDTO): Promise<IDepense> {
        return api.request<IDepense>({
            endpoint: `/finance/depenses/${id}`,
            method: "PUT",
            data,
        });
    },

    supprimerDepense(id: string): Promise<IDepense> {
        return api.request<IDepense>({
            endpoint: `/finance/depenses/${id}`,
            method: "DELETE",
        });

    },

    // obtenirStatsDepenses(): Promise<IDepenseStatsResponse> {
    //     return api.request<IDepenseStatsResponse>({
    //         endpoint: `/depenses/stats`,
    //         method: "POST",
    //     });
    // },

}
