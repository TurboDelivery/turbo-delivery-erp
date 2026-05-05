'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvalidateRegularisationQuery } from './index.query';
import {
  approuverRegularisationMutation,
  rejeterRegularisationMutation,
} from '@/features/validation-tickets/regularisation/mutations/regularisation.mutation';

export const useApprouverRegularisationMutation = () => {
  const invalidate = useInvalidateRegularisationQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await approuverRegularisationMutation(id);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket approuvé avec succès.');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'approbation", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRejeterRegularisationMutation = () => {
  const invalidate = useInvalidateRegularisationQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await rejeterRegularisationMutation(id);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket rejeté.');
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
