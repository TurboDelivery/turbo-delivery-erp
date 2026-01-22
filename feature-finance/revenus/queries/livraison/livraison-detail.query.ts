import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { obtenirLivraisonAction } from '../../actions/livraison.action';
import { livraisonKeyQuery } from './index.query';

const queryClient = getQueryClient();


//1- Option de requête
export const livraisonQueryOption = (id: string) => {
    return {
        queryKey: livraisonKeyQuery("detail", id),
        queryFn: async () => {
            if (!id) throw new Error("L'identifiant livraison est requis");

            const result = await obtenirLivraisonAction(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled: !!id,
    };
};

//2- Hook pour récupérer une livraison
export const useLivraisonQuery = (id: string) => {
    const query = useQuery(livraisonQueryOption(id));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération de la livraison:", {
                description: query.error.message,
            });
        }
    }, [query.isError, query.error]);

    return query;
};

//3- Fonction pour précharger une livraison appelée dans les pages
export const prefetchLivraisonQuery = (
    id: string
) => {
    return queryClient.prefetchQuery(livraisonQueryOption(id));
}
