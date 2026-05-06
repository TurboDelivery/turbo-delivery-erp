import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { performanceKeyQuery } from './index.query';
import { toast } from 'sonner';
import { obtenirPerformanceAction } from '@/features/rapports-performance/actions/performance.action';
import { IPerformanceParams } from '@/features/rapports-performance/types/performance.type';
import { performanceAPI } from '../apis/performance.api';

const queryClient = getQueryClient();

// 1- Option de requête
export const performanceQueryOption = (params: IPerformanceParams) => {
  return {
    queryKey: performanceKeyQuery('dashboard', params),
    queryFn: async () => {
        const data = await performanceAPI.obtenirPerformance(params);
        console.log('Données de performance obtenues:', data);
        return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  };
};

// 2- Hook pour récupérer les données de performance
export const usePerformanceQuery = (params: IPerformanceParams) => {
  const query = useQuery(performanceQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des données de performance', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

// 3- Fonction pour précharger les données de performance
export const prefetchPerformanceQuery = (params: IPerformanceParams) => {
  return queryClient.prefetchQuery(performanceQueryOption(params));
};
