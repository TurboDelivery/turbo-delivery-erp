import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTurboyAction, rejectTurboyAction, updateTurboyTypeAction, passerEnBirdAction, bulkDesactiverLivreursAction, bulkActiverLivreursAction } from '@/features/turboys/actions/turboy.actions';
import { ITurboy, IUpdateTurboyTypePayload } from '@/features/turboys/types/turboys.types';
import { toast } from 'sonner';
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

export const useRejectTurboyMutation = (handleSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await rejectTurboyAction(userId);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du rejet du livreur');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      toast.success('Le livreur a été rejeté avec succès.');
      if (handleSuccess) handleSuccess();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors du rejet: ${message}`);
    },
  });
};

export const usePasserEnBirdMutation = (handleSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (livreurId: string) => {
      const result = await passerEnBirdAction(livreurId);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du passage en Bird');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      toast.success('Le livreur a été passé en Bird avec succès.');
      if (handleSuccess) handleSuccess();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors du passage en Bird: ${message}`);
    },
  });
};

export const useDeleteTurboyMutation = (handleSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTurboyAction(id);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression du livreur');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      toast.success('Le livreur a été supprimé avec succès.');
      if (handleSuccess) handleSuccess();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la suppression: ${message}`);
    },
  });
};

export const useBulkDesactiverLivreursMutation = (handleSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await bulkDesactiverLivreursAction(ids);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la désactivation des livreurs');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      toast.success('Les livreurs ont été désactivés avec succès.');
      if (handleSuccess) handleSuccess();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la désactivation: ${message}`);
    },
  });
};

export const useBulkActiverLivreursMutation = (handleSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await bulkActiverLivreursAction(ids);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'activation des livreurs');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      toast.success('Les livreurs ont été activés avec succès.');
      if (handleSuccess) handleSuccess();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'activation: ${message}`);
    },
  });
};
