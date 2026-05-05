'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvalidateTicketsV2Query } from './index.query';
import { validerV1Ticket } from '@/src/actions/bon-commande.action';

export const useValiderV1Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const result = await validerV1Ticket(ticketId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket validé V1.');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation V1', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
