import React from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { ticketsV2KeyQuery } from './index.query';
import { listerTicketsParStatutRequest, getCreneauTicketStatsRequest } from '@/features/tickets/request/tickets.request';
import { StatutControle } from '@/types/statut-controle.enum';
import { PaginatedResponse } from '@/types/general';
import { IVerrouillageParams, TicketControleV2 } from '../types/tickets-v2.type';

const queryClient = getQueryClient();

const getNextPage = (last: PaginatedResponse<TicketControleV2>) =>
  last.totalPages > last.pageable.pageNumber ? last.pageable.pageNumber + 1 : undefined;

// --- Colonne gauche : tickets AUTHENTIFIÉS (prêts pour validation V1) ---

export const ticketsAuthentifiesQueryOption = (params: IVerrouillageParams = {}) => ({
  queryKey: ticketsV2KeyQuery(StatutControle.AUTHENTIFIE, params),
  queryFn: async ({ pageParam = 0 }) =>
    listerTicketsParStatutRequest({ statuts: [StatutControle.AUTHENTIFIE], ...params, page: pageParam }) as Promise<PaginatedResponse<TicketControleV2>>,
  getNextPageParam: getNextPage,
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
  queryClient.prefetchInfiniteQuery(ticketsAuthentifiesQueryOption(params));

// --- Colonne droite : tickets V1_VALIDÉS ---

export const ticketsV1ValideQueryOption = (params: IVerrouillageParams = {}) => ({
  queryKey: ticketsV2KeyQuery(StatutControle.V1_VALIDE, params),
  queryFn: async ({ pageParam = 0 }) =>
    listerTicketsParStatutRequest({ statuts: [StatutControle.V1_VALIDE], ...params, page: pageParam }) as Promise<PaginatedResponse<TicketControleV2>>,
  getNextPageParam: getNextPage,
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
  queryClient.prefetchInfiniteQuery(ticketsV1ValideQueryOption(params));

// --- Stats du créneau courant ---

export const useCreneauTicketStatsQuery = (creneauId?: string) => {
  const query = useQuery({
    queryKey: ticketsV2KeyQuery('stats', creneauId),
    queryFn: () => getCreneauTicketStatsRequest(creneauId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);
  return query;
};
