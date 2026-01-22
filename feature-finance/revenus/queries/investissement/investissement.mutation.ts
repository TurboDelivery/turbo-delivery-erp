"use client";

import {
    useMutation,
} from '@tanstack/react-query';

import { useInvalidateInvestissementQuery } from './index.query';
import { toast } from "sonner";
import { processAndValidateFormData } from "ak-zod-form-kit";
import { InvestissementCreateSchema, InvestissementUpdateSchema, InvestissementCreateDTO, InvestissementUpdateDTO } from "../../schemas/investissement.schema";
import { ajouterInvestissementAction, modifierInvestissementAction, supprimerInvestissementAction } from '../../actions/investissement.action';

export const useAjouterInvestissementMutation = () => {
    const invalidateInvestissementQuery = useInvalidateInvestissementQuery()

    return useMutation({
        mutationFn: async (data: InvestissementCreateDTO) => {
            // Validation des données
            const validation = processAndValidateFormData(InvestissementCreateSchema, data,
                {
                    outputFormat: "object",
                })

            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            // Appel de l'API avec l'action
            const result = await ajouterInvestissementAction(validation.data as InvestissementCreateDTO);

            if (!result.success) {
                throw new Error(result.error || "Erreur lors de l'ajout de l'investissement");
            }

            return result.data!;
        },
        onSuccess: async () => {
            await invalidateInvestissementQuery();
            toast.success("Investissement ajoutée avec succès");
        },

        onError: async (error) => {
            toast.error("Erreur lors de l'ajout de l'investissement:", {
                description: error.message,
            });
        },
    });
};

export const useModifierInvestissementMutation = () => {
    const invalidateInvestissementQuery = useInvalidateInvestissementQuery()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: InvestissementUpdateDTO }) => {
            // Validation des données
            const validation = processAndValidateFormData(InvestissementUpdateSchema, data,
                {
                    outputFormat: "object"

                })
            if (!validation.success) {
                throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
            }

            const result = await modifierInvestissementAction(id, validation.data as InvestissementUpdateDTO)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la modification de l'investissement");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidateInvestissementQuery();
            toast.success("Investissement modifiée avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur modification investissement:", {
                description: error.message,
            });
        },
    });
};

export const useSupprimerInvestissementMutation = () => {
    const invalidateInvestissementQuery = useInvalidateInvestissementQuery()
    return useMutation({
        mutationFn: async (id: string) => {
            if (!id) {
                throw new Error("L'identifiant de l'investissement est requis.");
            }
            const result = await supprimerInvestissementAction(id)
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la suppression de l'investissement");
            }
            return result.data!;
        },
        onSuccess: async () => {
            await invalidateInvestissementQuery();
            toast.success("Investissement supprimée avec succès");
        },
        onError: async (error) => {
            toast.error("Erreur suppression investissement:", {
                description: error.message,
            });
        },
    });
};