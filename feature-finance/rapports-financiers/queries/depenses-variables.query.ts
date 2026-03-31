import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { depensesVariablesKeyQuery } from './index.query';
import { toast } from 'sonner';
import { IDepenseVariableParams } from '@/feature-finance/rapports-financiers/types/depenses-variables.type';
import { depensesVariablesAPI } from '../apis/depenses-variables.api';

const queryClient = getQueryClient();

// 1- Option de requête
export const depensesVariablesQueryOption = (params: IDepenseVariableParams) => {
  return {
    queryKey: depensesVariablesKeyQuery('list', params),
    queryFn: async () => {
      const data = await depensesVariablesAPI.obtenirDepensesVariables(params);
      console.log('Données de dépenses variables obtenues:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  };
};

// 2- Hook pour récupérer les dépenses variables
export const useDepensesVariablesQuery = (params: IDepenseVariableParams) => {
  const query = useQuery(depensesVariablesQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des dépenses variables', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

// 3- Préchargement
export const prefetchDepensesVariablesQuery = (params: IDepenseVariableParams) => {
  return queryClient.prefetchQuery(depensesVariablesQueryOption(params));
};
