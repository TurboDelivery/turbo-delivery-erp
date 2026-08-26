import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'sonner';
import { getBonLivraisonStatsRequest } from '@/features/tickets/request/tickets.request';

const queryClient = getQueryClient();

export const ticketsStatsQueryOption = (ticketsParamsDTO: ITicketParams) => {
  return {
    queryKey: ticketsKeyQuery('stats', ticketsParamsDTO),
    queryFn: async () => {
      return await getBonLivraisonStatsRequest(ticketsParamsDTO);
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus
    refetchOnMount: true, //Refetch lors du mount
  };
};

export const useTicketsStatsQuery = (ticketsParamsDTO: ITicketParams) => {
  const query = useQuery(ticketsStatsQueryOption(ticketsParamsDTO));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchTicketsStatsQuery = (ticketsParamsDTO: ITicketParams) => {
  return queryClient.prefetchQuery(ticketsStatsQueryOption(ticketsParamsDTO));
};
