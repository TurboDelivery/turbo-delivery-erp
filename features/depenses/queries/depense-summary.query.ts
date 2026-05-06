import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { depenseKeyQuery } from './index.query';
import { toast } from 'sonner';
import { IDepenseSummaryParams } from '@/features/depenses/types/depense.type';
import { depenseAPI } from '@/features/depenses/apis/depense.api';

const queryClient = getQueryClient();

//1- Option de requête
export const depenseSummaryQueryOption = (params: IDepenseSummaryParams) => {
  return {
    queryKey: depenseKeyQuery('summary', params),
    queryFn: async () => {
      return await depenseAPI.obtenirDepensesSummary(params);
    },
    staleTime: 5 * 60 * 1000, //5 minutes
  };
};

//2- Hook pour récupérer le summary des dépenses
export const useDepenseSummaryQuery = (params: IDepenseSummaryParams) => {
  const query = useQuery(depenseSummaryQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération du summary dépenses:', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query]);

  return query;
};

//3- Fonction pour précharger le summary des dépenses
export const prefetchDepenseSummaryQuery = (params: IDepenseSummaryParams) => {
  return queryClient.prefetchQuery(depenseSummaryQueryOption(params));
};
