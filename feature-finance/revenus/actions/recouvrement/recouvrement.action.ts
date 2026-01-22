"use server";
import { ActionResponse, PaginatedResponse } from "@/types";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { IRecouvrement, IRecouvrementParams, IRecouvrementSubmission } from "../../types/recouvrement/recouvrement.types";
import { recouvrementAPI } from "../../apis/recouvrement.api";
import { IFacture } from "../../types/recouvrement/prets.types";

interface RecouvrementSubmissionWithDetails extends IRecouvrementSubmission {
    factureDetails: IFacture;
}

export async function ajouterRecouvrementAction(
    submissionData: RecouvrementSubmissionWithDetails
): Promise<ActionResponse<IRecouvrement>> {
    try {
        const { montant, dateRecouvrement, restaurantId, preuve, factureDetails } = submissionData;


        if (!montant || !dateRecouvrement || !restaurantId || !preuve || !factureDetails) {
            return {
                success: false,
                error: "Tous les champs obligatoires doivent être remplis",
            };
        }

        // Créer FormData avec la structure exacte attendue par l'API
        const formData = new FormData();
        
        // Créer l'objet DTO comme attendu par l'API
        const dto = {
            montant: montant,
            dateRecouvrement: dateRecouvrement,
            preuve: "string", // Valeur placeholder, sera remplacée par le fichier
            restaurantId: factureDetails.id, // Utiliser factureDetails.id qui contient l'ID du restaurant
            nomRestaurant: factureDetails.nomRestaurant
        };
        
    
        
        // Créer un Blob pour le DTO avec le bon Content-Type
        const dtoBlob = new Blob([JSON.stringify(dto)], { 
            type: 'application/json' 
        });
        
        // Ajouter le DTO en tant que Blob
        formData.append('dto', dtoBlob);
        
        // Ajouter le fichier de preuve séparément
        formData.append('preuve', preuve);

        console.log("=== Structure FormData envoyée à l'API ===");
        console.log("DTO structure:", JSON.stringify(dto, null, 2));
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: File: ${value.name} (${value.size} bytes, type: ${value.type})`);
            } else {
                console.log(`${key}:`, value);
            }
        }

        const createdRecouvrement = await recouvrementAPI.ajouterRecouvrement(formData);

        return {
            success: true,
            data: createdRecouvrement,
            message: "Recouvrement ajouté avec succès.",
        };
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la création du recouvrement.");
    }
}

export async function modifierRecouvrementAction(
    id: string,
    formData: FormData
): Promise<ActionResponse<IRecouvrement>> {

    try {

        const updatedRecouvrement = await recouvrementAPI.modifierRecouvrement(id, formData);

        return {
            success: true,
            data: updatedRecouvrement,
            message: "Recouvrement modifié avec succès.",
        };

    } catch (apiError: any) {
        return handleServerActionError(apiError, "Erreur lors de la mise à jour du recouvrement.");
    }
}

export async function supprimerRecouvrementAction(
    id: string
): Promise<ActionResponse<void>> {

    try {
        await recouvrementAPI.supprimerRecouvrement(id);
        return {
            success: true,
            message: "Recouvrement supprimé avec succès.",
        };
    } catch (apiError: any) {
        return handleServerActionError(apiError, "Erreur lors de la suppression du recouvrement.");
    }
}


export async function obtenirRecouvrementDetailAction(id: string): Promise<ActionResponse<IRecouvrement>> {
    try {
        const getRecouvrement = await recouvrementAPI.obtenirRecouvrement(id);
        return {
            success: true,
            data: getRecouvrement,
            message: "Recouvrement récupéré avec succès.",
        };
    } catch (apiError: any) {
        return handleServerActionError(apiError, "Erreur lors de la récupération du recouvrement.");
    }
}



export async function obtenirTousRecouvrementsAction(params: IRecouvrementParams):
    Promise<ActionResponse<PaginatedResponse<IRecouvrement>>> {
    try {
        const getAllRecouvrements = await recouvrementAPI.obtenirTousRecouvrements(params);
        return {
            success: true,
            data: getAllRecouvrements,
            message: "Recouvrements récupérés avec succès.",
        };
    } catch (apiError: any) {
        return handleServerActionError(apiError, "Erreur lors de la récupération des recouvrements.");
    }
}

