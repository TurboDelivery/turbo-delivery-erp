import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'react-toastify';
import { getDeliveryMenRecapPayRequest } from '@/features/tickets/request/livreurs.request';
import { IRecapPaiementLivreurSearchParams } from '@/features/tickets/types/livreur.type';

const queryClient = getQueryClient();

export const recapPaieStatsQueryKey = (params: IRecapPaiementLivreurSearchParams) => ['recap-paie-stats', params.debut?.toISOString(), params.fin?.toISOString()];

export const recapPaieStatsQueryOption = (params: IRecapPaiementLivreurSearchParams) => {
  return {
    queryKey: recapPaieStatsQueryKey(params),
    queryFn: async () => {
      return await getDeliveryMenRecapPayRequest(params);
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: false, // Ne pas refetch lors du focus
    refetchOnMount: false, // Ne pas refetch lors du mount (utiliser les données en cache)
  };
};

export const useLivreurRecapPaieStatsQuery = (params: IRecapPaiementLivreurSearchParams) => {
  const query = useQuery(recapPaieStatsQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération du récapitulatif de paie: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchRecapPaieStatsQuery = (params: IRecapPaiementLivreurSearchParams) => {
  return queryClient.prefetchQuery(recapPaieStatsQueryOption(params));
};

export const invalidateRecapPaieStatsQuery = (params?: IRecapPaiementLivreurSearchParams) => {
  if (params) {
    return queryClient.invalidateQueries({ queryKey: recapPaieStatsQueryKey(params) });
  }
  return queryClient.invalidateQueries({ queryKey: ['recap-paie-stats'] });
};
