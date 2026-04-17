import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-toastify';

import { traficKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { getTraficDeliversRequest } from '@/features/trafic/request/trafic.request';
import { TraficLivreursResponse } from '@/features/trafic/types/trafic.type';

const TRAFIC_REFRESH_MS = 30_000;

export const traficQueryOption = (initialData?: TraficLivreursResponse) => ({
  queryKey: traficKeyQuery('livreurs'),
  queryFn: () => getTraficDeliversRequest(),
  staleTime: TRAFIC_REFRESH_MS,
  refetchInterval: TRAFIC_REFRESH_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  ...(initialData ? { initialData } : {}),
});

export const useTraficQuery = (initialData?: TraficLivreursResponse) => {
  const query = useQuery<TraficLivreursResponse>(traficQueryOption(initialData));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error(
        'Erreur lors de la récupération du trafic livreurs: ' +
          (query.error instanceof Error ? query.error.message : 'Erreur inconnue'),
      );
    }
  }, [query.isError, query.error]);

  return query;
};

export const prefetchTraficQuery = () => {
  const queryClient = getQueryClient();
  return queryClient.prefetchQuery(traficQueryOption());
};
