import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { obtenirTousDepensesAction } from '../actions/depense.action';
import { IDepensesParams } from '@/features/depenses/types/depense.type';
import { depenseKeyQuery } from './index.query';
import { toast } from 'sonner';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const depensesListQueryOption = (depensesParamsDTO: IDepensesParams) => {
  return {
    queryKey: depenseKeyQuery('list', depensesParamsDTO),
    queryFn: async () => {
      const result = await obtenirTousDepensesAction(depensesParamsDTO);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  };
};

//2- Hook pour récupérer les dépenses
export const useDepensesListQuery = (depensesParamsDTO: IDepensesParams) => {
  const query = useQuery(depensesListQueryOption(depensesParamsDTO));

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

//3- Fonction pour précharger les dépenses appelée dans les pages
export const prefetchDepensesListQuery = (depensesParamsDTO: IDepensesParams) => {
  return queryClient.prefetchQuery(depensesListQueryOption(depensesParamsDTO));
};
