import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'react-toastify';
import { getBonLivraisonRequest } from '@/features/tickets/request/tickets.request';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const ticketsListQueryOption = (ticketsParamsDTO: ITicketParams) => {
  return {
    queryKey: ticketsKeyQuery('list', ticketsParamsDTO),
    queryFn: async () => {
      return await getBonLivraisonRequest(ticketsParamsDTO);
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus de la fenetre
    refetchOnMount: true, //Refetch lors du mount
  };
};

//2- Hook pour récupérer les actualités
export const useTicketsListQuery = (ticketsParamsDTO: ITicketParams) => {
  const query = useQuery(ticketsListQueryOption(ticketsParamsDTO));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

//3. Prefetch de la liste des actualités
export const prefetchticketsListQuery = (ticketsParamsDTO: ITicketParams) => {
  return queryClient.prefetchQuery(ticketsListQueryOption(ticketsParamsDTO));
};
