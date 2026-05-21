'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvalidateTicketsV2Query } from './index.query';
import { validerV1Ticket, validerV2Ticket, validerV2EnMasseTicket, rejeterTicketPourFraude } from '@/src/actions/bon-commande.action';

export const useValiderV1Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const result = await validerV1Ticket(ticketId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: async () => {
      toast.success('Ticket validé V1.');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation V1', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
    // Invalide la liste DANS TOUS LES CAS — sinon, si le backend rejette
    // (ex. "V1 impossible, statut=V1_VALIDE déjà"), le bouton reste cliquable
    // sur un ticket fantôme et l'utilisateur reclique indéfiniment.
    onSettled: async () => {
      await invalidate();
    },
  });
};

export const useValiderV2Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const result = await validerV2Ticket(ticketId);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      toast.success('Ticket validé V2.');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation V2', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
    onSettled: async () => {
      await invalidate();
    },
  });
};

export const useValiderV2EnMasseMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async () => {
      const result = await validerV2EnMasseTicket();
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Tous les tickets ont été validés V2.');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation V2 en masse', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRejeterV2FraudeMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const result = await rejeterTicketPourFraude(id, motif);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket rejeté pour fraude.');
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
