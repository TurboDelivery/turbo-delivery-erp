import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'react-toastify';
import { getLivreursWithTicketsRequest } from '@/features/tickets/request/tickets.request';

const queryClient = getQueryClient();

export const livreurTicketsListQueryOption = (ticketsParamsDTO: ITicketParams) => {
  return {
    queryKey: ticketsKeyQuery('livreur-list', ticketsParamsDTO),
    queryFn: async () => {
      return await getLivreursWithTicketsRequest(ticketsParamsDTO);
    },
    staleTime: 60 * 1000, //60 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus de la fenetre
    refetchOnMount: true, //Refetch lors du mount
  };
};

export const useLivreurTicketsListQuery = (ticketsParamsDTO: ITicketParams) => {
  const query = useQuery(livreurTicketsListQueryOption(ticketsParamsDTO));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchLivreurTicketsListQuery = (ticketsParamsDTO: ITicketParams) => {
  return queryClient.prefetchQuery(livreurTicketsListQueryOption(ticketsParamsDTO));
};
