import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ILivreurSearchParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'sonner';
import { getLivreursWithTicketsRequest } from '@/features/tickets/request/tickets.request';

const queryClient = getQueryClient();

export const livreurTicketsListQueryOption = (livreurParamsDTO: ILivreurSearchParams) => {
  return {
    queryKey: ticketsKeyQuery('livreur-ticket-list', livreurParamsDTO),
    queryFn: async () => {
      if (!livreurParamsDTO.idLivreur?.trim()){
        return { content: [], totalElements: 0, totalPages: 0, pageable: { pageNumber: 0, pageSize: 1 } };
      }
      return await getLivreursWithTicketsRequest(livreurParamsDTO);
    },
    staleTime: 60 * 1000, //60 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus de la fenetre
    refetchOnMount: true, //Refetch lors du mount
  };
};

export const useLivreurTicketsListQuery = (livreurParamsDTO: ILivreurSearchParams) => {
  const query = useQuery(livreurTicketsListQueryOption(livreurParamsDTO));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets des livreurs: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchLivreurTicketsListQuery = (livreurParamsDTO: ILivreurSearchParams) => {
  return queryClient.prefetchQuery(livreurTicketsListQueryOption(livreurParamsDTO));
};
