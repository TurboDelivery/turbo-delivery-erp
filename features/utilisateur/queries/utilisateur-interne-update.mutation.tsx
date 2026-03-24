"use client";

import {addToast} from "@heroui/toast";
import {useMutation} from '@tanstack/react-query';
import {processAndValidateFormData} from "ak-zod-form-kit";
import {CheckCircle2, X} from "lucide-react";
import {utilisateurAPI} from "../apis/utilisateur.api";
import {UtilisateurInterneUpdateDTO, UtilisateurInterneUpdateSchema} from '@/features/utilisateur/schema';
import {useInvalidateUtilisateurQuery} from './index.query';

export const useModifierUtilisateurInterneMutation = () => {
	const invalidateUtilisateurQuery = useInvalidateUtilisateurQuery()

	return useMutation({
		mutationFn: async ({id, data}: { id: string, data: UtilisateurInterneUpdateDTO }) => {
			// Validation des données
			const validation = processAndValidateFormData(UtilisateurInterneUpdateSchema, data,
				{
					outputFormat: "object",
					transformations: {
						firstName: (value: string | undefined) => value?.trim(),
						lastName: (value: string | undefined) => value?.trim(),
						email: (value: string | undefined) => value?.trim().toLowerCase(),
						phone: (value: string | undefined) => value?.trim(),
					},
				})

			if (!validation.success) {
				throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
			}

			// Appel de l'API avec l'action
			return await utilisateurAPI.modifierProfil(id, validation.data as UtilisateurInterneUpdateDTO);
		},
		onSuccess: async () => {
			addToast({
				title: "Utilisateur interne modifié avec succès",
				description: "Les informations de l'utilisateur interne ont été mises à jour",
				promise: invalidateUtilisateurQuery(),
				icon: <CheckCircle2/>,
				color: "success",
			});
		},

		onError: async (error: Error) => {
			addToast({
				title: "Erreur lors de la modification de l'utilisateur interne",
				description: error.message,
				promise: Promise.reject(error),
				icon: <X/>,
				color: "danger",
			});
		},
	});
};


