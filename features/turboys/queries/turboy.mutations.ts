import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTurboyTypeAction } from '@/features/turboys/actions/turboy.actions';
import { ITurboy, IUpdateTurboyTypePayload } from '@/features/turboys/types/turboys.types';
import { toast } from 'react-toastify';
import { turboyKeys } from './turboy-list.query';

export const useUpdateTurboyTypeMutation = (handleSuccess?: (turboy: ITurboy) => void, handleError?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IUpdateTurboyTypePayload) => {
      const result = await updateTurboyTypeAction(payload);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification du type de livreur');
      }

      return result.data!;
    },
    onSuccess: async (data) => {
      console.log('Turboy type updated successfully:', data);
      // Invalide la liste des turboys
      await queryClient.invalidateQueries({
        queryKey: turboyKeys.lists(),
      });
      // Invalide le détail du turboy
      await queryClient.invalidateQueries({
        queryKey: turboyKeys.detail(data.id),
      });

      toast.success('Le type de livreur a été modifié avec succès.');
      if (handleSuccess) {
        handleSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Erreur lors de la modification du type de livreur:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la modification: ${message}`);
      if (handleError) handleError();
    },
  });
};
