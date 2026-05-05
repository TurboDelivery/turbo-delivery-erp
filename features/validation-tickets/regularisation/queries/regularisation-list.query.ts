import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { regularisationKeyQuery } from './index.query';
import { listerRegularisationMutation } from '@/features/validation-tickets/regularisation/mutations/regularisation.mutation';
import { IRegularisationParams } from '@/features/validation-tickets/regularisation/types/regularisation.type';

const queryClient = getQueryClient();

// 1- Option de requête
export const regularisationListQueryOption = (params: IRegularisationParams) => ({
  queryKey: regularisationKeyQuery('list', params),
  queryFn: async () => {
    const result = await listerRegularisationMutation(params);
    if (!result.success) throw new Error(result.error as string);
    return result.data!;
  },
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
});

// 2- Hook
export const useRegularisationListQuery = (params: IRegularisationParams) => {
  const query = useQuery(regularisationListQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets en régularisation', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

// 3- Prefetch
export const prefetchRegularisationListQuery = (params: IRegularisationParams) =>
  queryClient.prefetchQuery(regularisationListQueryOption(params));
