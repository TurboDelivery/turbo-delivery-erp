import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { ticketsV2KeyQuery } from './index.query';
import { listerTicketsV2Mutation } from '@/features/validation-tickets/verrouillage-v2/mutations/tickets-v2.mutation';
import { ITicketsV2Params } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';

const queryClient = getQueryClient();

// 1- Option de requête
export const ticketsV2ListQueryOption = (params: ITicketsV2Params) => ({
  queryKey: ticketsV2KeyQuery('list', params),
  queryFn: async () => {
    const result = await listerTicketsV2Mutation(params);
    if (!result.success) throw new Error(result.error as string);
    return result.data!;
  },
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
});

// 2- Hook
export const useTicketsV2ListQuery = (params: ITicketsV2Params) => {
  const query = useQuery(ticketsV2ListQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets V2', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

// 3- Prefetch
export const prefetchTicketsV2ListQuery = (params: ITicketsV2Params) =>
  queryClient.prefetchQuery(ticketsV2ListQueryOption(params));
