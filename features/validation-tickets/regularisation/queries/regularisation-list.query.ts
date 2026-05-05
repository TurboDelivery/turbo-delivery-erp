import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { regularisationKeyQuery } from './index.query';
import { listerRegularisationMutation } from '@/features/validation-tickets/regularisation/mutations/regularisation.mutation';

const queryClient = getQueryClient();

export const regularisationListQueryOption = () => ({
  queryKey: regularisationKeyQuery('list'),
  queryFn: async () => {
    const result = await listerRegularisationMutation();
    if (!result.success) throw new Error(result.error as string);
    return result.data!;
  },
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
});

export const useRegularisationListQuery = () => {
  const query = useQuery(regularisationListQueryOption());

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets en retard', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchRegularisationListQuery = () =>
  queryClient.prefetchQuery(regularisationListQueryOption());
