import { IFacture, IFactureParams  } from "../types/recouvrement/prets.types";
import { PretCreateDTO, PretUpdateDTO } from "../schemas/recouvrement/prets.schema";
import { api } from "@/lib/api";
import { SearchParams } from "nuqs";
import { IRecouvrement } from "../types/recouvrement/recouvrement.types";

export interface IPretAPI {
    obtenirTousPrets(params: IFactureParams): Promise<IFacture[]>;
    obtenirPret(id: string): Promise<IFacture>;
    obtenirRecouvrementsRestaurant(restaurantId: string): Promise<IRecouvrement[]>;
    ajouterPret(data: PretCreateDTO): Promise<IFacture>;
    modifierPret(id: string, data: PretUpdateDTO): Promise<IFacture>;
    supprimerPret(id: string): Promise<IFacture>;
}

export const pretAPI: IPretAPI = {
    async obtenirTousPrets(params: IFactureParams): Promise<IFacture[]> {
        return await api.request<IFacture[]>({
            endpoint: `/finance/factures`,
            method: "GET",
            searchParams: params as SearchParams,
        });
    },

    async obtenirPret(id: string): Promise<IFacture> {
        return await api.request<IFacture>({
            endpoint: `/finance/recouvrements/${id}/`,
            method: "GET",
        });
    },

    obtenirRecouvrementsRestaurant(restaurantId: string): Promise<IRecouvrement[]> {
        return api.request<IRecouvrement[]>({
            endpoint: `/finance/recouvrements/${restaurantId}/restaurant`,
            method: "GET",
        });
    },
    ajouterPret(data: PretCreateDTO): Promise<IFacture> {
        return api.request<IFacture>({
            endpoint: `/finance/prets`,
            method: "POST",
            data,
        });
    },

    modifierPret(id: string, data: PretUpdateDTO): Promise<IFacture> {
        return api.request<IFacture>({
            endpoint: `/finance/prets/${id}`,
            method: "PUT",
            data,
        });
    },

    supprimerPret(id: string): Promise<IFacture> {
        return api.request<IFacture>({
            endpoint: `/finance/prets/${id}`,
            method: "DELETE",
        });

    },

}
