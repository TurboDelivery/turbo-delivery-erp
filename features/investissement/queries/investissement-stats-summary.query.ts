import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { investissementKeyQuery } from './index.query';
import { toast } from 'sonner';
import { investissementStatsAPI } from '@/features/investissement/apis/investissement-stats.api';
import { IInvestissementStatsParams } from '@/features/investissement/types/inestissement.types';

const queryClient = getQueryClient();

//1- Option de requête pour le summary
export const investissementStatsSummaryQueryOption = (params: IInvestissementStatsParams) => {
  return {
    queryKey: investissementKeyQuery('stats', 'summary', params),
    queryFn: async () => {
      return await investissementStatsAPI.obtenirStatsSummary(params);
    },
    staleTime: 5 * 60 * 1000, //5 minutes
  };
};

//2- Hook pour récupérer le summary des stats d'investissement
export const useInvestissementStatsSummaryQuery = (params: IInvestissementStatsParams) => {
  const query = useQuery(investissementStatsSummaryQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques:', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

//3- Fonction pour précharger le summary des stats
export const prefetchInvestissementStatsSummaryQuery = (params: IInvestissementStatsParams) => {
  return queryClient.prefetchQuery(investissementStatsSummaryQueryOption(params));
};

