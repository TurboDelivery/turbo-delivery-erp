import { api } from "@/lib/api";
import { SearchParams } from "ak-api-http";
import { CategorieDepenseCreateDTO, CategorieDepenseUpdateDTO } from "../schemas/categorie-depense.schema";
import { ICategorieDepense, ICategorieDepenseParams, ICategorieDepenseStatsResponse } from "../types/categorie-depense.type";

export interface ICategorieDepenseAPI {
    create(dto: CategorieDepenseCreateDTO): Promise<ICategorieDepense>;
    obtenirToutesCategoriesDepenses(params: ICategorieDepenseParams): Promise<ICategorieDepense[]>;
    obtenirCategoriesActives(params: ICategorieDepenseParams): Promise<ICategorieDepense[]>;
    getStats(): Promise<ICategorieDepenseStatsResponse>;
    findOne(id: string): Promise<ICategorieDepense>;
    update(id: string, dto: CategorieDepenseUpdateDTO): Promise<ICategorieDepense>;
    remove(id: string): Promise<ICategorieDepense>;
}

export const categorieDepenseAPI: ICategorieDepenseAPI = {
    async create(dto: CategorieDepenseCreateDTO): Promise<ICategorieDepense> {
        return await api.request<ICategorieDepense>({
            endpoint: `/finance/categories`,
            method: "POST",
            data: dto,
        });
    },

    async obtenirToutesCategoriesDepenses(params: ICategorieDepenseParams): Promise<ICategorieDepense[]> {
        return await api.request<ICategorieDepense[]>({
            endpoint: `/finance/categories`,
            method: "GET",
            searchParams: params as SearchParams,
        });
    },

    async obtenirCategoriesActives(params: ICategorieDepenseParams): Promise<ICategorieDepense[]> {
        return await api.request<ICategorieDepense[]>({
            endpoint: `/finance/categories`,
            method: "GET",
            searchParams: { ...params, isActive: true },
        });
    },

    async getStats(): Promise<ICategorieDepenseStatsResponse> {
        return await api.request<ICategorieDepenseStatsResponse>({
            endpoint: `/finance/categories/stats`,
            method: "GET",
        });
    },

    async findOne(id: string): Promise<ICategorieDepense> {
        return await api.request<ICategorieDepense>({
            endpoint: `/finance/categories/${id}`,
            method: "GET",
        });
    },

    async update(id: string, dto: CategorieDepenseUpdateDTO): Promise<ICategorieDepense> {
        return await api.request<ICategorieDepense>({
            endpoint: `/finance/categories/${id}`,
            method: "PUT",
            data: dto,
        });
    },

    async remove(id: string): Promise<ICategorieDepense> {
        return await api.request<ICategorieDepense>({
            endpoint: `/finance/categories/${id}`,
            method: "DELETE",
        });
    },
};
