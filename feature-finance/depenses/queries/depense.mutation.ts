"use client";

import {
    useMutation,
} from '@tanstack/react-query';
import {
    ajouterDepenseAction,
    modifierDepenseAction,
    supprimerDepenseAction,
} from '../actions/depense.action';
import { useInvalidateDepenseQuery } from './index.query';
import { toast } from "sonner";
import { processAndValidateFormData } from "ak-zod-form-kit";
import { DepenseCreateSchema, DepenseUpdateSchema, DepenseCreateDTO, DepenseUpdateDTO } from "../schemas/depense.schema";

export const useAjouterDepenseMutation = () => {
    const invalidateDepenseQuery = useInvalidateDepenseQuery()

    return useMutation({
        mutationFn: async (data: DepenseCreateDTO) => {
            // Validation des données
            const validation = processAndValidateFormData(DepenseCreateSchema, data,
                {
                    outputFormat: "object",
                })

            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            // Appel de l'API avec l'action
            const result = await ajouterDepenseAction(validation.data as DepenseCreateDTO);

            if (!result.success) {
                throw new Error(result.error || "Erreur lors de l'ajout de la dépense");
            }

            return result.data!;
        },
        onSuccess: async () => {
            await invalidateDepenseQuery();
            toast.success("Depense ajoutée avec succès");
        },

        onError: async (error) => {
            toast.error("Erreur lors de l'ajout de la dépense:", {
                description: error.message,
            });
        },
    });
};

export const useModifierDepenseMutation = () => {
    const invalidateDepenseQuery = useInvalidateDepenseQuery()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: DepenseUpdateDTO }) => {
            // Validation des données
            const validation = processAndValidateFormData(DepenseUpdateSchema, data,
                {
                    outputFormat: "object"

                })
            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            const result = await modifierDepenseAction(id, validation.data as DepenseUpdateDTO)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la modification de la dépense");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidateDepenseQuery();
            toast.success("Depense modifiée avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur modification depense:", {
                description: error.message,
            });
        },
    });
};

export const useSupprimerDepenseMutation = () => {
    const invalidateDepenseQuery = useInvalidateDepenseQuery()
    return useMutation({
        mutationFn: async (id: string) => {
            if (!id) {
                throw new Error("L'identifiant de la dépense est requis.");
            }
            const result = await supprimerDepenseAction(id)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la suppression de la dépense");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidateDepenseQuery();
            toast.success("Depense supprimée avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur suppression depense:", {
                description: error.message,
            });
        },
    });
};