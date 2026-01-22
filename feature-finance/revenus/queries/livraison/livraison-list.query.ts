
import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { ILivraisonParams } from '../../types/livraison.types';
import { obtenirTousLivraisonsAction } from '../../actions/livraison.action';
import { livraisonKeyQuery } from './index.query';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const livraisonListQueryOption = (livraisonParamsDTO: ILivraisonParams) => {
    return {
        queryKey: livraisonKeyQuery("list", livraisonParamsDTO),
        queryFn: async () => {
            const result = await obtenirTousLivraisonsAction(livraisonParamsDTO);
            if (!result.success) {
                throw new Error(result.error);
            }
           return result.data;
        },
        placeholderData: (previousData: any) => previousData,
        staleTime: 30 * 1000,//30 secondes
        refetchOnWindowFocus: false,//Ne pas refetch lors du focus de la fenetre
        refetchOnMount: true,//Refetch lors du mount
    };
};

//2- Hook pour récupérer les livraisons
export const useLivraisonListQuery = (
    livraisonParamsDTO: ILivraisonParams
) => {
    const query = useQuery(livraisonListQueryOption(livraisonParamsDTO));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des livraisons:", {
                description: query.error.message,
            });
        }
    }, [query]);

    return query;
};

//3- Fonction pour précharger les livraisons appelée dans les pages
export const prefetchLivraisonListQuery = (
    livraisonParamsDTO: ILivraisonParams
) => {
    return queryClient.prefetchQuery(livraisonListQueryOption(livraisonParamsDTO));
}
