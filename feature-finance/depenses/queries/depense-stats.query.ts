import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { depenseKeyQuery } from './index.query';
import { toast } from 'sonner';
import { obtenirStatsDepensesAction } from '@/feature-finance/depenses/actions/depense.action';
import { IDepenseStatsParams } from '@/features/depenses/types/depense.type';

const queryClient = getQueryClient();

//1- Option de requête
export const depenseStatsQueryOption = (params: IDepenseStatsParams) => {
  return {
    queryKey: depenseKeyQuery('stats', params),
    queryFn: async () => {
      const result = await obtenirStatsDepensesAction(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, //5 minutes
  };
};

//2- Hook pour récupérer les stats dé   penses
export const useDepenseStatsQuery = (params: IDepenseStatsParams) => {
  const query = useQuery(depenseStatsQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des dépenses:', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query]);

  return query;
};

//3- Fonction pour précharger les stats utilisateurs
export const prefetchDepenseStatsQuery = (params: IDepenseStatsParams) => {
  return queryClient.prefetchQuery(depenseStatsQueryOption(params));
};
