import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenirTop4CategoriesDepensesAction } from '../../actions/categorie-depense.action';
import { categorieDepenseKeyQuery } from './index.query';
import { toast } from 'sonner';
import getQueryClient from '@/lib/get-query-client';
import { ITopCategoriesSearchParams } from '@/features/depenses/types/categorie-depense.type';

const queryClient = getQueryClient();

// 1- Option de requête optimisée
export const top4CategorieDepenseQueryOption = (params: ITopCategoriesSearchParams) => {
  return {
    queryKey: categorieDepenseKeyQuery('top4', params),
    queryFn: async () => {
      const result = await obtenirTop4CategoriesDepensesAction(params);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération du top 4 des catégories');
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  };
};

// 2- Hook pour récupérer le top 4
export const useTop4CategorieDepenseQuery = (params: ITopCategoriesSearchParams) => {
  const query = useQuery(top4CategorieDepenseQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération du top 4 des catégories', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

// 3- Fonction pour précharger le top 4
export const prefetchTop4CategorieDepenseQuery = (params: ITopCategoriesSearchParams) => {
  return queryClient.prefetchQuery(top4CategorieDepenseQueryOption(params));
};
