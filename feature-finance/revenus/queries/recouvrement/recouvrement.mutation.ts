"use client";

import {
    useMutation,
} from '@tanstack/react-query';
import { toast } from "sonner";
import { processAndValidateFormData } from "ak-zod-form-kit";
import { useInvalidateRecouvrementQuery } from './index.query';
import { RecouvrementCreateDTO, recouvrementFormSchema } from "../../schemas/recouvrement/recouvrement.schema";
import { ajouterRecouvrementAction, modifierRecouvrementAction, supprimerRecouvrementAction } from '../../actions/recouvrement/recouvrement.action';
import { IFacture } from '../../types/recouvrement/prets.types';

interface RecouvrementSubmissionData extends RecouvrementCreateDTO {
    factureDetails: IFacture;
}

export const useAjouterRecouvrementMutation = () => {
    const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery()

    return useMutation({
        mutationFn: async (data: RecouvrementSubmissionData) => {
            console.log("Données reçues par le mutation:", data);
            
            // Appel direct de l'action serveur avec les données complètes
            const result = await ajouterRecouvrementAction(data);

            if (!result.success) {
                console.error("Erreur retournée par l'action:", result.error);
                throw new Error(result.error || "Erreur lors de la création du recouvrement");
            }

            console.log("Recouvrement créé avec succès:", result.data);
            return result.data!;
        },
        onSuccess: async () => {
            await invalidateRecouvrementQuery();
            toast.success("Recouvrement ajouté avec succès");
        },
        onError: async (error) => {
            console.error("Erreur dans la mutation:", error);
            toast.error("Erreur lors de l'ajout du recouvrement", {
                description: error.message,
            });
        },
    });
};
export const useModifierRecouvrementMutation = () => {
    const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: RecouvrementCreateDTO }) => {
            // Validation des données
            const validation = processAndValidateFormData(recouvrementFormSchema, data,
                {
                    outputFormat: "formData"

                });

            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            if (!id) {
                throw new Error("L'identifiant de la photo est requis.");
            }

            // Appel de l'API avec l'action
            const result = await modifierRecouvrementAction(id, validation.data as FormData);

            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la modification du recouvrement");
            }

            return result.data!;
        },
        onSuccess: async () => {
            await invalidateRecouvrementQuery();
            toast.success("Recouvrement modifié avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur modification recouvrement:", {
                description: error.message,
            });
        },
    });
};


export const useSupprimerRecouvrementMutation = () => {
    const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery()
    return useMutation({
        mutationFn: async (id: string) => {
            if (!id) {
                throw new Error("L'identifiant du recouvrement est requis.");
            }
            const result = await supprimerRecouvrementAction(id)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la suppression du recouvrement");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidateRecouvrementQuery();
            toast.success("Recouvrement supprimé avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur suppression recouvrement:", {
                description: error.message,
            });
        },
    });
};