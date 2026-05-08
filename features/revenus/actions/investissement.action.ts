"use server";

import { ActionResponse, PaginatedResponse } from "@/types";
import { handleApiError } from "@/utils/handle-api-error";
import { InvestissementCreateDTO, InvestissementUpdateDTO } from "../schemas/investissement.schema";
import { IInvestissement, IInvestissementParams } from "../types/revenus.types";
import { investissementAPI } from "../apis/investissement.api";

export const obtenirTousInvestissementsAction = async (params?: IInvestissementParams): Promise<ActionResponse<PaginatedResponse<IInvestissement>>> => {
  try {
    const response = await investissementAPI.obtenirTousInvestissements(params || {});

    return {
      success: true,
      data: response,
      message: 'Investissements obtenus avec succès',
    };
  } catch (error) {
    console.error('❌ Action: Erreur', error);
    return handleApiError(error, 'Erreur lors de la récupération des investissements');
  }
};

export const obtenirInvestissementAction = async (id: string): Promise<ActionResponse<IInvestissement>> => {
    try {
        const response = await investissementAPI.obtenirInvestissement(id);
        return {
            success: true,
            data: response,
            message: "Investissement obtenu avec succès",
        }
    } catch (error) {
        return handleApiError(error, "Erreur lors de la récupération de l'investissement");
    }
}

export const ajouterInvestissementAction = async (data: InvestissementCreateDTO): Promise<ActionResponse<IInvestissement>> => {
    try {
        const response = await investissementAPI.ajouterInvestissement(data);
        return {
            success: true,
            data: response,
            message: "Investissement ajouté avec succès",
        }
    } catch (error) {
        return handleApiError(error, "Erreur lors de l'ajout de l'investissement");
    }
}

export const modifierInvestissementAction = async (id: string, data: InvestissementUpdateDTO): Promise<ActionResponse<IInvestissement>> => {
    try {
        const response = await investissementAPI.modifierInvestissement(id, data);
        return {
            success: true,
            data: response,
            message: "Investissement modifié avec succès",
        }
    } catch (error) {
        return handleApiError(error, "Erreur lors de la modification de l'investissement");
    }
}

export const supprimerInvestissementAction = async (id: string): Promise<ActionResponse<IInvestissement>> => {
    try {
        const data = await investissementAPI.supprimerInvestissement(id);
        return {
            success: true,
            data: data,
            message: "Investissement supprimé avec succès",
        }
    } catch (error) {
        return handleApiError(error, "Erreur lors de la suppression de l'investissement");
    }
}