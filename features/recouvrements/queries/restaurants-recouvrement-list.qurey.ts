import React from 'react';

import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { recouvrementKeyQuery } from './index.query';
import { toast } from 'sonner';
import { obtenirRestaurantRecouvrementsRequest } from '@/features/recouvrements/requests/recouvrements.request';
import { IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { IRecouvrement } from '@/features/revenus/types/recouvrement/recouvrement.types';
import { obtenirRecouvrementsRestaurantAction } from '@/features/revenus/actions/recouvrement/prets.action';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const restaurantsRecouvrementListQueryOption = (params: IRestaurantRecouvrementSearchParams) => {
  return {
    queryKey: recouvrementKeyQuery('list', params),
    queryFn: async () => {
      const result = await obtenirRestaurantRecouvrementsRequest(params);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    gcTime: 5 * 60 * 1000, //5 minutes
    staleTime: 30 * 1000, //30 secondes
    refetchOnWindowFocus: false, //Ne pas refetch lors du focus de la fenetre
    refetchOnMount: true, //Refetch lors du mount
  };
};

//2- Hook pour récupérer les recouvrements
export const useRestaurantsRecouvrementQuery = (params: IRestaurantRecouvrementSearchParams) => {
  const query = useQuery(restaurantsRecouvrementListQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des recouvrements:', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query]);

  return query;
};

//3- Préfetch des recouvrements d'un restaurant
export const prefetchRecouvrementRestaurantsDetailQuery = (params: IRestaurantRecouvrementSearchParams) => {
  return queryClient.prefetchQuery(restaurantsRecouvrementListQueryOption(params));
};

export const useRecouvrementsRestaurantQuery = (restaurantId: string) => {
  const query = useQuery({
    queryKey: recouvrementKeyQuery('restaurant', restaurantId),
    queryFn: async (): Promise<IRecouvrement[]> => {
      const result = await obtenirRecouvrementsRestaurantAction(restaurantId);
      console.log("📋 Résultat de l'action:", result);
      if (!result.success) {
        throw new Error(result.error);
      }
      // Vérifier si la réponse est paginée
      if (result.data && typeof result.data === 'object' && 'content' in result.data) {
        return Array.isArray(result.data.content) ? result.data.content : [];
      }
      // Si ce n'est pas paginé, vérifier que c'est un tableau
      if (Array.isArray(result.data)) {
        return result.data;
      }
      return [];
    },
    enabled: !!restaurantId,
    placeholderData: (previousData: any) => previousData,
    staleTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: false, // Ne pas refetch lors du focus de la fenetre
    refetchOnMount: true, // Refetch lors du mount
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      if (query.error instanceof Error) {
        toast.error('Erreur lors du chargement des recouvrements', {
          description: query.error.message,
        });
      } else {
        toast.error('Erreur lors du chargement des recouvrements', {
          description: 'Erreur inconnue',
        });
      }
    }
  }, [query]);

  return query;
};
