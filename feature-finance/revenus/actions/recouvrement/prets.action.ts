"use server";

import { ActionResponse } from "@/types";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { pretAPI } from "../../apis/prets.api";
import { IFacture, IFactureParams } from "../../types/recouvrement/prets.types";
import { PretCreateDTO, PretUpdateDTO } from "../../schemas/recouvrement/prets.schema";
import { IRecouvrement } from "../../types/recouvrement/recouvrement.types";

export const obtenirTousPretsAction = async (params: IFactureParams): Promise<ActionResponse<IFacture[]>> => {
    try {
        const response = await pretAPI.obtenirTousPrets(params);
        return {
            success: true,
            data: response,
            message: "Prets obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des prets");
    }
}
export const obtenirPretAction = async (id: string): Promise<ActionResponse<IFacture>> => {
    try {
        const response = await pretAPI.obtenirPret(id);
        return {
            success: true,
            data: response,
            message: "Pret obtenue avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des prets");
    }
}

export const obtenirRecouvrementsRestaurantAction = async (restaurantId: string): Promise<ActionResponse<IRecouvrement[]>> =>{
    try {
        const response = await pretAPI.obtenirRecouvrementsRestaurant(restaurantId);
        return {
            success: true,
            data: response,
            message: "Recouvrements obtenus avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des recouvrements");
    }
}

export const ajouterPretAction = async (data: PretCreateDTO): Promise<ActionResponse<IFacture>> => {
    try {
        const response = await pretAPI.ajouterPret(data);
        return {
            success: true,
            data: response,
            message: "Pret ajoutée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de l'ajout de pret");
    }
}

export const modifierPretAction = async (id: string, data: PretUpdateDTO): Promise<ActionResponse<IFacture>> => {
    try {
        const response = await pretAPI.modifierPret(id, data);
        return {
            success: true,
            data: response,
            message: "Pret modifiée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la modification de pret");
    }
}

export const supprimerPretAction = async (id: string): Promise<ActionResponse<IFacture>> => {
    try {
        const data = await pretAPI.supprimerPret(id);
        return {
            success: true,
            data: data,
            message: "Pret supprimée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la suppression de pret");
    }
}
