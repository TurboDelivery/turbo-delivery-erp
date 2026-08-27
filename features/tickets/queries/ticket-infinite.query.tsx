import React from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'sonner';
import { getBonLivraisonRequest } from '@/features/tickets/request/tickets.request';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const ticketsInfiniteQueryOption = (ticketsParamsDTO: ITicketParams) => {
  return {
    queryKey: ticketsKeyQuery('list', ticketsParamsDTO),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      return await getBonLivraisonRequest({ ...ticketsParamsDTO, page: pageParam });
    },
    staleTime: 60 * 1000, //
    refetchOnMount: true,
  initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedResponse<BonLivraisonTerminee>) => {
      const hasNextPage = lastPage.totalPages > lastPage.pageable.pageNumber;
      return hasNextPage ? lastPage.pageable.pageNumber + 1 : undefined;
    },
    getPreviousPageParam: (firstPage: PaginatedResponse<BonLivraisonTerminee>) => {
      const hasPreviousPage = firstPage.pageable.pageNumber > 0;
      return hasPreviousPage ? firstPage.pageable.pageNumber - 1 : undefined;
    },
  };
};

//2- Hook pour récupérer les actualités
export const useTicketsInfiniteQuery = (ticketsParamsDTO: ITicketParams) => {
  if (ticketsParamsDTO.search?.trim()) {
    ticketsParamsDTO.restaurantId = '';
    ticketsParamsDTO.livreurId = '';
    ticketsParamsDTO.debut = undefined;
    ticketsParamsDTO.fin = undefined;
  }
  const query = useInfiniteQuery(ticketsInfiniteQueryOption(ticketsParamsDTO));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

//3. Prefetch de la liste des actualités
export const prefetchTicketsInfiniteQuery = (ticketsParamsDTO: ITicketParams) => {
  return queryClient.prefetchInfiniteQuery(ticketsInfiniteQueryOption(ticketsParamsDTO));
};
