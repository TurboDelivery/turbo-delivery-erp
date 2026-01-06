import { useMutation } from '@tanstack/react-query';
import { useInvalidateTicketsQuery } from './index.query';
import { createBonLivraison, deleteBonLivraison, updateBonLivraison } from '@/src/actions/bon-commande.action';
import { Ticket } from '@/types/bon-livraison.model';
import { toast } from 'react-toastify';

export const useCreateBonLivraison = (handleSuccess?: () => void, handleError?: () => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async (ticket: Ticket) => {
      const result = await createBonLivraison(ticket);
      if (!result.success) {
        console.error(result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      if (handleSuccess) {
        toast.success('Le ticket a été créé avec succès.');
        handleSuccess();
      }
    },
    onError: (error) => {
      console.error('Erreur création bon de livraison:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la création du ticket: ${message}`);
      if (handleError) handleError();
    },
  });
};

export const useUpdateBonLivraison = (handleSuccess?: () => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async ({ ticketId, ticket }: { ticketId: string; ticket: Ticket }) => {
      const result = await updateBonLivraison(ticketId, ticket);
      if (!result.success) {
        console.error(result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      toast.success('Le bon de livraison a été mis à jour avec succès.');
      if (handleSuccess) {
        handleSuccess();
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour du ticket: ${message}`);
      console.error(error);
    },
  });
};

export const useDeleteBonLivraison = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: deleteBonLivraison,
    onSuccess: async () => {
      await invalidateTicketsQuery();
    },
  });
};
