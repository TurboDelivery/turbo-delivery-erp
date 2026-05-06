import { ActionResponse } from "@/types";
import { ILivraison, ILivraisonParams } from "../types/livraison.types";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { livraisonAPI } from "../apis/livraison.api";

export const obtenirTousLivraisonsAction = async (params: ILivraisonParams): Promise<ActionResponse<ILivraison[]>> => {
    try {
        const response = await livraisonAPI.obtenirTousLivraisons(params);
        return {
            success: true,
            data: response,
            message: "Livraisons obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des livraisons");
    }
}

export const obtenirLivraisonAction = async (id: string): Promise<ActionResponse<ILivraison>> => {
    try {
        const response = await livraisonAPI.obtenirLivraison(id);
        return {
            success: true,
            data: response,
            message: "Livraison obtenue avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération de la livraison");
    }
}