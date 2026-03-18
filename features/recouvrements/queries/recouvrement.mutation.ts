'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvalidateRecouvrementQuery } from './index.query';
import { RecouvrementCreateDTO } from '@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema';
import { supprimerRecouvrementAction } from '@/feature-finance/revenus/actions/recouvrement/recouvrement.action';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { recouvrementAPI } from '../apis/recouvrement.api';

interface RecouvrementSubmissionData extends RecouvrementCreateDTO {
  factureDetails: IFacture;
}

interface RecouvrementModificationData {
  id: string;
  data: Omit<RecouvrementCreateDTO, 'preuve'> & { preuve?: File };
}

export const useAjouterRecouvrementMutation = () => {
  const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery();

  return useMutation({
    mutationFn: async (data: RecouvrementSubmissionData) => {
      const formData = new FormData();

      formData.append('montant', data.montant.toString());
      formData.append('dateRecouvrement', data.dateRecouvrement.toISOString().split('T')[0]);
      formData.append('restaurantId', data.factureDetails.id);
      formData.append('nomRestaurant', data.factureDetails.nomRestaurant);
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
    mutationFn: async ({ id, data }: RecouvrementModificationData) => {
      if (!id) throw new Error("L'identifiant du recouvrement est requis.");

      const formData = new FormData();

      formData.append('montant', data.montant.toString());
      formData.append('dateRecouvrement', data.dateRecouvrement.toISOString().split('T')[0]);
      formData.append('restaurantId', data.restaurantId);

      if (data.preuve) {
        formData.append('preuve', data.preuve, data.preuve.name);
      }

      const dtoBlob = formData.get('dto') as Blob;
      dtoBlob?.text().then((text) => {
        console.log('FormData dto avant action:', text);
        console.log('FormData preuve avant action:', formData.get('preuve'));
      });

      return await recouvrementAPI.modifierRecouvrement(id, formData);
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
      if (!id) throw new Error("L'identifiant du recouvrement est requis.");

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
