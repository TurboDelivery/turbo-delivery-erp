
import { PaginatedResponse } from "@/types";
import { api } from "@/lib/api";
import { SearchParams } from "ak-api-http";
import { IRecouvrement, IRecouvrementParams } from "../types/recouvrement/recouvrement.types";
export interface IRecouvrementAPI {
    obtenirTousRecouvrements: (params: IRecouvrementParams) => Promise<PaginatedResponse<IRecouvrement>>;
    obtenirRecouvrement: (id: string) => Promise<IRecouvrement>;
    obtenirRecouvrementsRestaurant: (restaurantId: string) => Promise<IRecouvrement[]>;
    obtenirTousRestaurants: () => Promise<string[]>;
    ajouterRecouvrement: (data: FormData) => Promise<IRecouvrement>;
    modifierRecouvrement: (id: string, formData: FormData) => Promise<IRecouvrement>;
    supprimerRecouvrement: (id: string) => Promise<IRecouvrement>;
}

export const recouvrementAPI: IRecouvrementAPI = {
    obtenirTousRecouvrements(params: IRecouvrementParams): Promise<PaginatedResponse<IRecouvrement>> {
        // Validation des paramètres

        return api.request<PaginatedResponse<IRecouvrement>>({
            endpoint: `finance/recouvrements`,
            method: "GET",
            searchParams: params as SearchParams
        });
    },

    obtenirRecouvrement(id: string): Promise<IRecouvrement> {
        return api.request<IRecouvrement>({
            endpoint: `finance/recouvrements/${id}`,
            method: "GET",
        });
    },

    async obtenirRecouvrementsRestaurant(restaurantId: string): Promise<IRecouvrement[]> {
        return await api.request<IRecouvrement[]>({
          endpoint: `/finance/recouvrements/${restaurantId}/restaurant`,
          method: "GET",
        });
    },

    async obtenirTousRestaurants(): Promise<string[]> {
        return await api.request<string[]>({
          endpoint: `/finance/recouvrements/restaurants`,
          method: "GET",
        });
    },
      
    ajouterRecouvrement(formData: FormData): Promise<IRecouvrement> {
        // Forcer le Content-Type correct pour multipart/form-data
        return api.request<IRecouvrement>({
            endpoint: `finance/recouvrements`,
            method: "POST",
            data: formData,
            config: {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        });
    },

    modifierRecouvrement(id: string, formData: FormData): Promise<IRecouvrement> {
        return api.request<IRecouvrement>({
            endpoint: `finance/recouvrements/${id}`,
            method: "PUT",
            data: formData,
            // Important: ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
            config: {
                headers: {
                    // Laisser le navigateur définir le Content-Type avec le boundary correct
                },
            },
        });
    },

    supprimerRecouvrement(id: string): Promise<IRecouvrement> {

        return api.request<IRecouvrement>({
            endpoint: `finance/recouvrements/${id}`,
            method: "DELETE",
        });
    },


};

// export interface IRecouvrementAPI {
//     obtenirTousRecouvrements(params: IRecouvrementParams): Promise<IRecouvrement[]>;
//     obtenirRecouvrement(id: string): Promise<IRecouvrement>;
//     ajouterRecouvrement(data: RecouvrementCreateDTO): Promise<IRecouvrement>;
//     modifierRecouvrement(id: string, data: RecouvrementUpdateDTO): Promise<IRecouvrement>;
//     supprimerRecouvrement(id: string): Promise<IRecouvrement>;
// }

