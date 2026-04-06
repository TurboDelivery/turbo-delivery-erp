'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paiementAPI } from '../apis/paiement.api';
import { useInvalidatePaiementQuery } from './index.query';

export const useInitierPaiementMutation = () => {
  const invalidate = useInvalidatePaiementQuery();

  return useMutation({
    mutationFn: async ({ ids, mois }: { ids: string[]; mois: string }) => {
      return paiementAPI.initierPaiement(ids, mois);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Paiement initié avec succès');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'initiation du paiement", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
