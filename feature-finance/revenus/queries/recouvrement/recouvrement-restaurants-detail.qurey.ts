import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { recouvrementKeyQuery } from './index.query';
import { toast } from 'sonner';
import { obtenirTousRecouvrementsAction } from '../../actions/recouvrement/recouvrement.action';
import { obtenirRecouvrementsRestaurantAction } from '../../actions/recouvrement/prets.action';
import { IRecouvrement } from '../../types/recouvrement/recouvrement.types';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const recouvrementRestaurantsDetailQueryOption = (restaurantId: string) => {
    return {
        queryKey: recouvrementKeyQuery("list", restaurantId),
        queryFn: async () => {
            const result = await obtenirTousRecouvrementsAction({restaurantId});
            if (!result.success) {
                throw new Error(result.error);
            }
            // Gérer les réponses paginées vs directes
            if (result.data && typeof result.data === 'object' && 'content' in result.data) {
                return result.data.content;
            }
            return result.data;
        },
        placeholderData: (previousData: any) => previousData,
        staleTime: 30 * 1000,//30 secondes
        refetchOnWindowFocus: false,//Ne pas refetch lors du focus de la fenetre
        refetchOnMount: true,//Refetch lors du mount
    };
};

//2- Hook pour récupérer les recouvrements
export const useRecouvrementRestaurantsDetailQuery = (
    restaurantId: string
) => {
    const query = useQuery(recouvrementRestaurantsDetailQueryOption(restaurantId));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des recouvrements:", {
                description: query.error instanceof Error ? query.error.message : "Erreur inconnue",
            });
        }
    }, [query]);

    return query;
};

//3- Fonction pour précharger les recouvrements appelée dans les pages
// Hook personnalisé pour les recouvrements de restaurant avec l'endpoint spécifique
export const useRecouvrementsRestaurantQuery = (restaurantId: string) => {
    const query = useQuery({
        queryKey: recouvrementKeyQuery("restaurant", restaurantId),
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
                toast.error("Erreur lors du chargement des recouvrements", {
                    description: query.error.message,
                });
            } else {
                toast.error("Erreur lors du chargement des recouvrements", {
                    description: "Erreur inconnue",
                });
            }
        }
    }, [query]);

    return query;
};

export const prefetchRecouvrementRestaurantsDetailQuery = (
    restaurantId: string
) => {
    return queryClient.prefetchQuery(recouvrementRestaurantsDetailQueryOption(restaurantId));
}