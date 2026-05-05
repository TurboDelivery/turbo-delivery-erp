'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvalidateTicketsV2Query } from './index.query';
import {
  verrouillerTicketMutation,
  verrouillerTousMutation,
  deverrouillerTicketMutation,
} from '@/features/validation-tickets/verrouillage-v2/mutations/tickets-v2.mutation';

export const useVerrouillerTicketV2Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await verrouillerTicketMutation(id);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket verrouillé avec succès.');
    },
    onError: (error) => {
      toast.error('Erreur lors du verrouillage', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useVerrouillerTousMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async () => {
      const result = await verrouillerTousMutation();
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Tous les tickets ont été verrouillés.');
    },
    onError: (error) => {
      toast.error('Erreur lors du verrouillage global', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useDeverrouillerTicketMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deverrouillerTicketMutation(id);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket déverrouillé.');
    },
    onError: (error) => {
      toast.error('Erreur lors du déverrouillage', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
