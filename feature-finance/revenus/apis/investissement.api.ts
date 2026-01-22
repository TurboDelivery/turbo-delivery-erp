import { SearchParams } from "ak-api-http";
import { api } from "@/lib/api";
import { IInvestissement, IInvestissementParams } from "../types/revenus.types";
import { InvestissementCreateDTO, InvestissementUpdateDTO } from "../schemas/investissement.schema";


export interface IInvestissementAPI {
    obtenirTousInvestissements(params: IInvestissementParams): Promise<IInvestissement[]>;
    obtenirInvestissement(id: string): Promise<IInvestissement>;
    ajouterInvestissement(data: InvestissementCreateDTO): Promise<IInvestissement>;
    modifierInvestissement(id: string, data: InvestissementUpdateDTO): Promise<IInvestissement>;
    supprimerInvestissement(id: string): Promise<IInvestissement>;
}

export const investissementAPI: IInvestissementAPI = {
    async obtenirTousInvestissements(params: IInvestissementParams): Promise<IInvestissement[]> {
        return await api.request<IInvestissement[]>({
            endpoint: `/finance/investissements`,
            method: "GET",
            searchParams: params as SearchParams,
        });
    },

    async obtenirInvestissement(id: string): Promise<IInvestissement> {
        return await api.request<IInvestissement>({
            endpoint: `/finance/investissements/${id}`,
            method: "GET",
        });
    },

    ajouterInvestissement(data: InvestissementCreateDTO): Promise<IInvestissement> {
        return api.request<IInvestissement>({
            endpoint: `/finance/investissements`,
            method: "POST",
            data,
        });
    },

    modifierInvestissement(id: string, data: InvestissementUpdateDTO): Promise<IInvestissement> {
        return api.request<IInvestissement>({
            endpoint: `/finance/investissements/${id}`,
            method: "PUT",
            data,
        });
    },

    supprimerInvestissement(id: string): Promise<IInvestissement> {
        return api.request<IInvestissement>({
            endpoint: `/investissements/${id}`,
            method: "DELETE",
        });

    },

}
