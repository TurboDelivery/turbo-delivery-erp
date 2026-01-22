"use server";

import { ActionResponse } from "@/types";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { InvestissementCreateDTO, InvestissementUpdateDTO } from "../schemas/investissement.schema";
import { IInvestissement, IInvestissementParams } from "../types/revenus.types";
import { investissementAPI } from "../apis/investissement.api";

// Action pour récupérer TOUS les investissements (sans filtrage)
export const obtenirTousInvestissementsAction = async (params?: IInvestissementParams): Promise<ActionResponse<IInvestissement[]>> => {
    try {
        console.log('🔍 Action: Récupération de tous les investissements', { params });
        
        // Si params est vide ou non défini, on récupère tout
        // Si params contient des filtres, on les envoie à l'API (pour compatibilité)
        const response = await investissementAPI.obtenirTousInvestissements(params || {});
        
        console.log('✅ Action: Données reçues', { count: response?.length });
        
        return {
            success: true,
            data: response,
            message: "Investissements obtenus avec succès",
        }
    } catch (error) {
        console.error('❌ Action: Erreur', error);
        return handleServerActionError(error, "Erreur lors de la récupération des investissements");
    }
}

// Action pour récupérer avec filtrage serveur (optionnel)
export const obtenirInvestissementsFiltresAction = async (params: IInvestissementParams): Promise<ActionResponse<IInvestissement[]>> => {
    try {
        console.log('🔍 Action: Récupération avec filtres serveur', { params });
        
        const response = await investissementAPI.obtenirTousInvestissements(params);
        
        return {
            success: true,
            data: response,
            message: "Investissements filtrés obtenus avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des investissements filtrés");
    }
}

export const obtenirInvestissementAction = async (id: string): Promise<ActionResponse<IInvestissement>> => {
    try {
        const response = await investissementAPI.obtenirInvestissement(id);
        return {
            success: true,
            data: response,
            message: "Investissement obtenu avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération de l'investissement");
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
        return handleServerActionError(error, "Erreur lors de l'ajout de l'investissement");
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
        return handleServerActionError(error, "Erreur lors de la modification de l'investissement");
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
        return handleServerActionError(error, "Erreur lors de la suppression de l'investissement");
    }
}