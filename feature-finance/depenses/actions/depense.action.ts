"use server";

import { ActionResponse, PaginatedResponse } from "@/types";
import { depenseAPI } from "../apis/depense.api";
import { IDepense, IDepensesParams, IDepenseStatsResponse } from "../types/depense.type";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { DepenseCreateDTO, DepenseUpdateDTO } from "../schemas/depense.schema";

export const obtenirTousDepensesAction = async (params: IDepensesParams): Promise<ActionResponse<IDepense[]>> => {
    try {
        const data = await depenseAPI.obtenirTousDepenses(params);
        return {
            success: true,
            data: data,
            message: "Depenses obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des dépenses");
    }
}

export const obtenirUneDepenseAction = async (id: string): Promise<ActionResponse<IDepense>> => {
    try {
        const data = await depenseAPI.obtenirDepense(id);
        return {
            success: true,
            data: data,
            message: "Depense obtenue avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération de la dépense");
    }
}

export const ajouterDepenseAction = async (data: DepenseCreateDTO): Promise<ActionResponse<IDepense>> => {
    try {
        const response = await depenseAPI.ajouterDepense(data);
        return {
            success: true,
            data: response,
            message: "Depense ajoutée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de l'ajout de la dépense");
    }
}

export const modifierDepenseAction = async (id: string, data: DepenseUpdateDTO): Promise<ActionResponse<IDepense>> => {
    try {
        const response = await depenseAPI.modifierDepense(id, data);
        return {
            success: true,
            data: response,
            message: "Depense modifiée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la modification de la dépense");
    }
}

export const supprimerDepenseAction = async (id: string): Promise<ActionResponse<IDepense>> => {
    try {
        const data = await depenseAPI.supprimerDepense(id);
        return {
            success: true,
            data: data,
            message: "Depense supprimée avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la suppression de la dépense");
    }
}

// export const obtenirStatsDepensesAction = async (): Promise<ActionResponse<IDepenseStatsResponse>> => {
//     try {
//         const response = await depenseAPI.obtenirStatsDepenses();
//         return {
//             success: true,
//             data: response,
//             message: "Stats dépenses obtenues avec succès",
//         }
//     } catch (error) {
//         return handleServerActionError(error, "Erreur lors de la récupération des stats dépenses");
//     }
// }