"use client";

import {addToast} from "@heroui/toast";
import {useMutation} from '@tanstack/react-query';
import {processAndValidateFormData} from "ak-zod-form-kit";
import {CheckCircle2, X} from "lucide-react";
import {utilisateurAPI} from "../apis/utilisateur.api";
import {UtilisateurInterneAddDTO, UtilisateurInterneAddSchema} from '@/features/utilisateur/schema';
import {useInvalidateUtilisateurQuery} from './index.query';

export const useAjouterUtilisateurInterneMutation = () => {
	const invalidateUtilisateurQuery = useInvalidateUtilisateurQuery()

	return useMutation({
		mutationFn: async ({data}: { data: UtilisateurInterneAddDTO }) => {
			// Validation des données
			const validation = processAndValidateFormData(UtilisateurInterneAddSchema, data,
				{
					outputFormat: "object",
					transformations: {
						firstName: (value: string) => value.trim(),
						lastName: (value: string) => value.trim(),
						email: (value: string) => value.trim().toLowerCase(),
					},
				})

			if (!validation.success) {
				throw new Error(validation.errorsInString || "Une erreur est survenue lors de la validation des données.");
			}

			// Appel de l'API avec l'action
			return await utilisateurAPI.ajouterUtilisateurInterne(validation.data as UtilisateurInterneAddDTO);
		},
		onSuccess: async () => {
			addToast({
				title: "Utilisateur interne ajouté avec succès",
				description: "L'utilisateur interne a été créé avec succès",
				promise: invalidateUtilisateurQuery(),
				icon: <CheckCircle2/>,
				color: "success",
			});
		},

		onError: async (error: Error) => {
			addToast({
				title: "Erreur lors de l'ajout de l'utilisateur interne",
				description: error.message,
				promise: Promise.reject(error),
				icon: <X/>,
				color: "danger",
			});
		},
	});
};

