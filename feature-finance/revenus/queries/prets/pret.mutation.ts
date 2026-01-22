"use client";

import {
    useMutation,
} from '@tanstack/react-query';

import { toast } from "sonner";
import { processAndValidateFormData } from "ak-zod-form-kit";
import { PretCreateDTO, pretSchema, PretUpdateDTO, PretUpdateSchema } from '../../schemas/recouvrement/prets.schema';
import { useInvalidatePretQuery } from './index.query';
import { ajouterPretAction, modifierPretAction, supprimerPretAction } from '../../actions/recouvrement/prets.action';

export const useAjouterPretMutation = () => {
    const invalidatePretQuery = useInvalidatePretQuery()

    return useMutation({
        mutationFn: async (data: PretCreateDTO) => {
            // Validation des données
            const validation = processAndValidateFormData(pretSchema, data,
                {
                    outputFormat: "formData",
                })

            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            // Appel de l'API avec l'action
            const result = await ajouterPretAction(validation.data as PretCreateDTO);

            if (!result.success) {
                throw new Error(result.error || "Erreur lors de l'ajout de pret");
            }

            return result.data!;
        },
        onSuccess: async () => {
            await invalidatePretQuery();
            toast.success("Pret ajoutée avec succès");  
        },

        onError: async (error) => {
            toast.error("Erreur lors de l'ajout de pret:", {
                description: error.message,
            });
        },
    });
};

export const useModifierPretMutation = () => {
    const invalidatePretQuery = useInvalidatePretQuery()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: PretUpdateDTO }) => {
            // Validation des données
            const validation = processAndValidateFormData(PretUpdateSchema, data,
                {
                    outputFormat: "formData",

                })
            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            const result = await modifierPretAction(id, validation.data as PretUpdateDTO)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la modification de pret");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidatePretQuery();
            toast.success("Pret modifiée avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur modification pret:", {
                description: error.message,
            });
        },
    });
};

export const useSupprimerPretMutation = () => {
    const invalidatePretQuery = useInvalidatePretQuery()
    return useMutation({
        mutationFn: async (id: string) => {
            if (!id) {
                throw new Error("L'identifiant de pret est requis.");
            }
            const result = await supprimerPretAction(id)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la suppression de pret");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidatePretQuery();
            toast.success("Pret supprimée avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur suppression pret:", {
                description: error.message,
            });
        },
    });
};