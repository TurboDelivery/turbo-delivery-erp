import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { IBilanAnnuelParams } from '@/features/rapports-performance/types/bilan-annuel.type';
import { bilanAnnuelAPI } from '../apis/bilan-annuel.api';

const queryClient = getQueryClient();

const bilanAnnuelKeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['bilan-annuel'];
  return ['bilan-annuel', ...params];
};

// 1- Option de requête
export const bilanAnnuelQueryOption = (params: IBilanAnnuelParams) => {
  return {
    queryKey: bilanAnnuelKeyQuery('dashboard', params),
    queryFn: async () => {
      const data = await bilanAnnuelAPI.obtenirBilanAnnuel(params);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
  };
};

// 2- Hook pour récupérer le bilan annuel
export const useBilanAnnuelQuery = (params: IBilanAnnuelParams) => {
  const query = useQuery(bilanAnnuelQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération du bilan annuel', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

// 3- Préchargement
export const prefetchBilanAnnuelQuery = (params: IBilanAnnuelParams) => {
  return queryClient.prefetchQuery(bilanAnnuelQueryOption(params));
};
