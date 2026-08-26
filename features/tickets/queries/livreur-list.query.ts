import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { getAllDeliveryMenRequest } from '@/features/tickets/request/livreurs.request';

const queryClient = getQueryClient();

export const livreursListQueryOption = () => {
  return {
    queryKey: ticketsKeyQuery('livreur-list'),
    queryFn: async () => {
      return await getAllDeliveryMenRequest();
    },
    staleTime: 60 * 1000, //60 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus de la fenêtre
    refetchOnMount: true, //Refetch lors du mount
  };
};

export const useLivreursListQuery = () => {
  const query = useQuery(livreursListQueryOption());

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des livreur: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchLivreursListQuery = () => {
  return queryClient.prefetchQuery(livreursListQueryOption());
};
