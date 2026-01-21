import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getDeliveryMenRecapPayRequest } from '@/features/tickets/request/livreurs.request';
import { IRecapPaiementLivreurSearchParams } from '@/features/tickets/types/livreur.type';

export const useGetLivreurRecapPaie = (handleSuccess?: () => void, handleError?: () => void) => {
  return useMutation({
    mutationFn: async (params: IRecapPaiementLivreurSearchParams) => {
      return await getDeliveryMenRecapPayRequest(params);
    },
    onSuccess: async () => {
      if (handleSuccess) {
        handleSuccess();
      }
    },
    onError: (error) => {
      console.error('Erreur récupération récapitulatif paie livreur:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la récupération du récapitulatif de paie des livreurs: ${message}`);
      if (handleError) handleError();
    },
  });
};