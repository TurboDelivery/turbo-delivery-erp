import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { investissementKeyQuery } from './index.query';
import { toast } from 'sonner';
import { investissementStatsAPI } from '@/features/investissement/apis/investissement-stats.api';
import { IInvestissementStatsParams } from '@/features/investissement/types/inestissement.types';

const queryClient = getQueryClient();

//1- Option de requête pour les données mensuelles
export const investissementStatsMonthlyQueryOption = (params: IInvestissementStatsParams) => {
  return {
    queryKey: investissementKeyQuery('stats', 'monthly', params),
    queryFn: async () => {
      return await investissementStatsAPI.obtenirMonthlyData(params);
    },
    staleTime: 5 * 60 * 1000, //5 minutes
  };
};

//2- Hook pour récupérer les données mensuelles des stats d'investissement
export const useInvestissementStatsMonthlyQuery = (params: IInvestissementStatsParams) => {
  const query = useQuery(investissementStatsMonthlyQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des données mensuelles:', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

//3- Fonction pour précharger les données mensuelles
export const prefetchInvestissementStatsMonthlyQuery = (params: IInvestissementStatsParams) => {
  return queryClient.prefetchQuery(investissementStatsMonthlyQueryOption(params));
};

