"use client";

import { addToast } from "@heroui/toast";
import { useMutation } from "@tanstack/react-query";
import { processAndValidateFormData } from "ak-zod-form-kit";
import { CheckCircle2, X } from "lucide-react";
import { utilisateurAPI } from "../apis/utilisateur.api";
import {
  UtilisateurUpdateDTO,
  UtilisateurUpdateSchema,
} from "../schema/utilisateur.schema";
import { useInvalidateUtilisateurQuery } from "./index.query";

export const useModifierProfilMutation = () => {
  const invalidateUtilisateurQuery = useInvalidateUtilisateurQuery();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UtilisateurUpdateDTO;
    }) => {
      // Validation des données
      const validation = processAndValidateFormData(
        UtilisateurUpdateSchema,
        data,
        {
          outputFormat: "object",
        }
      );
      if (!validation.success) {
        throw new Error(
          validation.errorsInString ||
            "Une erreur est survenue lors de la validation des données."
        );
      }

      const result = await utilisateurAPI.modifierProfil(
        id,
        validation.data as UtilisateurUpdateDTO
      );

      return result;
    },
    onSuccess: async () => {
      addToast({
        title: "Utilisateur modifié avec succès",
        description: "Utilisateur modifié avec succès",
        promise: invalidateUtilisateurQuery(),
        icon: <CheckCircle2 />,
        color: "success",
      });
    },
    onError: async (error:Error) => {
      addToast({
        title: "Erreur modification utilisateur:",
        description: error.message,
        promise: Promise.reject(error),
        icon: <X />,
        color: "danger",
      });
    },
  });
};
