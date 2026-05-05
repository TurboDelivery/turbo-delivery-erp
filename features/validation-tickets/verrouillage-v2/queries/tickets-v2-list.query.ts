import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { ticketsV2KeyQuery } from './index.query';
import { listerTicketsParStatutRequest } from '@/features/tickets/request/tickets.request';
import { StatutControle } from '@/types/statut-controle.enum';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types/general';
import { IVerrouillageParams } from '../types/tickets-v2.type';

const queryClient = getQueryClient();

const getNextPage = (last: PaginatedResponse<BonLivraisonTerminee>) =>
  last.totalPages > last.pageable.pageNumber ? last.pageable.pageNumber + 1 : undefined;

// --- Colonne gauche : tickets AUTHENTIFIÉS (prêts pour validation V1) ---

export const ticketsAuthentifiesQueryOption = (params: IVerrouillageParams = {}) => ({
  queryKey: ticketsV2KeyQuery(StatutControle.AUTHENTIFIE, params),
  queryFn: ({ pageParam = 0 }: { pageParam: number }) =>
    listerTicketsParStatutRequest({ statuts: [StatutControle.AUTHENTIFIE], ...params, page: pageParam }),
  getNextPageParam: getNextPage,
  initialPageParam: 0,
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
});

export const useTicketsAuthentifiesQuery = (params: IVerrouillageParams = {}) => {
  const query = useInfiniteQuery(ticketsAuthentifiesQueryOption(params));
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets authentifiés', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);
  return query;
};

export const prefetchTicketsAuthentifiesQuery = (params: IVerrouillageParams = {}) =>
  queryClient.prefetchInfiniteQuery({ ...ticketsAuthentifiesQueryOption(params), pages: 1 });

// --- Colonne droite : tickets V1_VALIDÉS ---

export const ticketsV1ValideQueryOption = (params: IVerrouillageParams = {}) => ({
  queryKey: ticketsV2KeyQuery(StatutControle.V1_VALIDE, params),
  queryFn: ({ pageParam = 0 }: { pageParam: number }) =>
    listerTicketsParStatutRequest({ statuts: [StatutControle.V1_VALIDE], ...params, page: pageParam }),
  getNextPageParam: getNextPage,
  initialPageParam: 0,
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
});

export const useTicketsV1ValideQuery = (params: IVerrouillageParams = {}) => {
  const query = useInfiniteQuery(ticketsV1ValideQueryOption(params));
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets V1 validés', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);
  return query;
};

export const prefetchTicketsV1ValideQuery = (params: IVerrouillageParams = {}) =>
  queryClient.prefetchInfiniteQuery({ ...ticketsV1ValideQueryOption(params), pages: 1 });
