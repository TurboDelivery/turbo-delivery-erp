import { useMutation } from '@tanstack/react-query';
import { useInvalidateTicketsQuery } from './index.query';
import { createBonLivraison, deleteBonLivraison, updateBonLivraison } from '@/src/actions/bon-commande.action';
import { Ticket } from '@/types/bon-livraison.model';
import { toast } from 'react-toastify';

export const useCreateBonLivraison = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: createBonLivraison,
    onSuccess: async () => {
      await invalidateTicketsQuery();
    },
    onError: (error, variables) => {
      toast.error('Une erreur est survenue lors de la mise à jour du bon de livraison.');
      console.error(error, variables);
    },
  });
};

export const useUpdateBonLivraison = (handleSuccess?: () => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async ({ ticketId, ticket }: { ticketId: string; ticket: Ticket }) => {
      return await updateBonLivraison(ticketId, ticket);
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      toast.success("Le bon de livraison a été mis à jour avec succès.");
      if (handleSuccess) {
        handleSuccess();
      }
    },
    onError: (error, variables) => {
      toast.error("Une erreur est survenue lors de la mise à jour du bon de livraison.");
      console.error(error, variables)
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
