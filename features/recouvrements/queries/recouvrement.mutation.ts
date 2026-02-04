'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { processAndValidateFormData } from 'ak-zod-form-kit';
import { useInvalidateRecouvrementQuery } from './index.query';
import { RecouvrementCreateDTO, recouvrementFormSchema } from '@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema';
import { modifierRecouvrementAction, supprimerRecouvrementAction } from '@/feature-finance/revenus/actions/recouvrement/recouvrement.action';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { recouvrementAPI } from '../apis/recouvrement.api';

interface RecouvrementSubmissionData extends RecouvrementCreateDTO {
  factureDetails: IFacture;
}

export const useAjouterRecouvrementMutation = () => {
  const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery();

  return useMutation({
    mutationFn: async (data: RecouvrementSubmissionData) => {
      // Créer FormData pour envoyer le File correctement
      const formData = new FormData();

      // Créer l'objet DTO sérialisable (sans le File)
      const dto = {
        montant: data.montant,
        dateRecouvrement: data.dateRecouvrement.toISOString().split('T')[0],
        restaurantId: data.factureDetails.id, // Utiliser l'ID de la facture comme restaurantId
        nomRestaurant: data.factureDetails.nomRestaurant,
        preuve: 'string', // Placeholder, sera remplacé par le fichier
      };

      // Créer un Blob pour le DTO avec le bon Content-Type
      const dtoBlob = new Blob([JSON.stringify(dto)], {
        type: 'application/json',
      });

      // Ajouter le DTO en tant que Blob
      formData.append('dto', dtoBlob);

      // Ajouter le fichier de preuve séparément
      formData.append('preuve', data.preuve, data.preuve.name);

      return await recouvrementAPI.ajouterRecouvrement(formData);
    },
    onSuccess: async () => {
      await invalidateRecouvrementQuery();
      toast.success('Recouvrement ajouté avec succès');
    },
    onError: async (error) => {
      toast.error("Erreur lors de l'ajout du recouvrement", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
export const useModifierRecouvrementMutation = () => {
  const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecouvrementCreateDTO }) => {
      // Validation des données
      const validation = processAndValidateFormData(recouvrementFormSchema, data, {
        outputFormat: 'formData',
      });

      if (!validation.success) {
        throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
      }

      if (!id) {
        throw new Error("L'identifiant de la photo est requis.");
      }

      // Appel de l'API avec l'action
      const result = await modifierRecouvrementAction(id, validation.data as FormData);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification du recouvrement');
      }

      return result.data!;
    },
    onSuccess: async () => {
      await invalidateRecouvrementQuery();
      toast.success('Recouvrement modifié avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur modification recouvrement:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerRecouvrementMutation = () => {
  const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("L'identifiant du recouvrement est requis.");
      }
      const result = await supprimerRecouvrementAction(id);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression du recouvrement');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateRecouvrementQuery();
      toast.success('Recouvrement supprimé avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur suppression recouvrement:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
