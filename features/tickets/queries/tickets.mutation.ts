import { useMutation } from '@tanstack/react-query';
import { useInvalidateTicketsQuery } from './index.query';
import { authentifierTicket, createBonLivraison, deleteBonLivraison, updateBonLivraison } from '@/src/actions/bon-commande.action';
import { restaurerArchivesRequest } from '@/features/tickets/request/tickets.request';
import { Ticket } from '@/types/bon-livraison.model';
import { toast } from 'sonner';

export const useCreateBonLivraison = (handleSuccess?: () => void, handleError?: () => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async ({ ticket, restaurant }: { ticket: Ticket; restaurant?: { typeCommission: string; commission: number } }) => {
      const result = await createBonLivraison(ticket, restaurant);
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
    mutationFn: async ({ ticketId, ticket, restaurant }: { ticketId: string; ticket: Ticket; restaurant?: { typeCommission: string; commission: number } }) => {
      const result = await updateBonLivraison(ticketId, ticket, restaurant);
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

export const useRestaurerArchives = (onSuccessFn?: (restored: Record<string, number>) => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: (commandeIds: string[]) => restaurerArchivesRequest(commandeIds),
    onSuccess: async (data, commandeIds) => {
      await invalidateTicketsQuery();
      const count = commandeIds.length;
      toast.success(`${count} ticket(s) restauré(s) avec succès.`);
      onSuccessFn?.(data);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la restauration: ${message}`);
    },
  });
};

export const useAuthentifierTicket = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const result = await authentifierTicket(ticketId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      toast.success('Ticket authentifié avec succès.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'authentification: ${message}`);
    },
  });
};
