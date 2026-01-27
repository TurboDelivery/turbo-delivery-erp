import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getDeliveryMenRecapPayRequest } from '@/features/tickets/request/livreurs.request';
import { IRecapPaiementLivreur, IRecapPaiementLivreurSearchParams } from '@/features/tickets/types/livreur.type';
import { invalidateRecapPaieStatsQuery } from './recap-paie-stats.query';

export const useGetLivreurRecapPaie = (handleSuccess?: (data: IRecapPaiementLivreur[]) => void, handleError?: () => void) => {
  return useMutation({
    mutationFn: async (params: IRecapPaiementLivreurSearchParams) => {
      return await getDeliveryMenRecapPayRequest(params);
    },
    onSuccess: async (data, params) => {
      // Invalider le cache pour synchroniser avec la query
      await invalidateRecapPaieStatsQuery(params);

      if (handleSuccess) {
        handleSuccess(data);
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