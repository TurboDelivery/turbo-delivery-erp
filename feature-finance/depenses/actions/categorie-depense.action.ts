"use server";

import { ActionResponse } from "@/types";
import { categorieDepenseAPI } from "../apis/categorie-depense.api";
import { ICategorieDepense, ICategorieDepenseParams } from "../types/categorie-depense.type";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { CategorieDepenseCreateDTO, CategorieDepenseUpdateDTO } from "../schemas/categorie-depense.schema";

export const obtenirCategoriesDepensesAction = async (params: ICategorieDepenseParams): Promise<ActionResponse<ICategorieDepense[]>> => {
    try {
        const response = await categorieDepenseAPI.obtenirToutesCategoriesDepenses(params);
        return {
            success: true,
            data: response,
            message: "Categories dépenses obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des categories dépenses");
    }
}
export const obtenirCategoriesDepensesActiveAction = async (params: ICategorieDepenseParams): Promise<ActionResponse<ICategorieDepense[]>> => {
    try {
        const response = await categorieDepenseAPI.obtenirCategoriesActives(params);
        return {
            success: true,
            data: response,
            message: "Categories dépenses obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des categories dépenses");
    }
}

export const ajouterCategorieDepenseAction = async (data: CategorieDepenseCreateDTO): Promise<ActionResponse<ICategorieDepense>> => {
    try {
        const response = await categorieDepenseAPI.create(data);
        return {
            success: true,
            data: response,
            message: "Depense ajoutée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de l'ajout de la dépense");
    }
}

export const modifierCategorieDepenseAction = async (id: string, data: CategorieDepenseUpdateDTO): Promise<ActionResponse<ICategorieDepense>> => {
    try {
        const response = await categorieDepenseAPI.update(id, data);
        return {
            success: true,
            data: response,
            message: "Depense modifiée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la modification de la dépense");
    }
}

export const supprimerCategorieDepenseAction = async (id: string): Promise<ActionResponse<ICategorieDepense>> => {
    try {
        const data = await categorieDepenseAPI.remove(id);
        return {
            success: true,
            data: data,
            message: "Depense supprimée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la suppression de la dépense");
    }
}
