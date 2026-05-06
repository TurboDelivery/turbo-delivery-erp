import { ActionResponse } from "@/types";
import { ICommission, ICommissionParams } from "../types/commission.types";
import { commissionAPI } from "../apis/commission.api";
import { handleServerActionError } from "@/utils/handleServerActionError";

export const obtenirTousCommissionsPourcentageAction = async (params: ICommissionParams): Promise<ActionResponse<ICommission[]>> => {
    try {
        const response = await commissionAPI.obtenirTousCommissionsPourcentage(params);
        return {
            success: true,
            data: response,
            message: "Investissements obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des investissements");
    }
}

export const obtenirTousCommissionsFixeAction = async (params: ICommissionParams): Promise<ActionResponse<ICommission[]>> => {
    try {
        const response = await commissionAPI.obtenirTousCommissionsFixe(params);
        return {
            success: true,
            data: response,
            message: "Investissements obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des investissements");
    }
}

export const obtenirCommissionAction = async (id: string): Promise<ActionResponse<ICommission>> => {
    try {
        const response = await commissionAPI.obtenirCommission(id);
        return {
            success: true,
            data: response,
            message: "Investissements obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des investissements");
    }
}