import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ILivreurStats, ITicketParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'react-toastify';
import { getLivreurStatsRequest } from '@/features/tickets/request/tickets.request';

const queryClient = getQueryClient();

export const livreurStatsQueryOption = (ticketsParamsDTO: ITicketParams) => {
  return {
    queryKey: ticketsKeyQuery('stats', ticketsParamsDTO),
    queryFn: async () => {
      if (!ticketsParamsDTO.livreurId) {
        return {
          totalTickets: 0,
          primeHebdo: false,
          totalLivraisons: 0,
        } satisfies ILivreurStats;
      }
      return (await getLivreurStatsRequest(ticketsParamsDTO))[0];
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus
    refetchOnMount: true, //Refetch lors du mount
  };
};

export const useLivreurStatsQuery = (ticketsParamsDTO: ITicketParams) => {
  const query = useQuery(livreurStatsQueryOption(ticketsParamsDTO));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchLivreurStatsQuery = (ticketsParamsDTO: ITicketParams) => {
  return queryClient.prefetchQuery(livreurStatsQueryOption(ticketsParamsDTO));
};
