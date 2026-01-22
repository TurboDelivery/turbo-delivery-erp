import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { depenseKeyQuery } from './index.query';
import { obtenirUneDepenseAction } from '../actions/depense.action';

const queryClient = getQueryClient();


//1- Option de requête
export const depenseQueryOption = (id: string) => {
    return {
        queryKey: depenseKeyQuery("detail", id),
        queryFn: async () => {
            if (!id) throw new Error("L'identifiant dépense est requis");

            const result = await obtenirUneDepenseAction(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled: !!id,
    };
};

//2- Hook pour récupérer un utilisateur
export const useDepenseQuery = (id: string) => {
    const query = useQuery(depenseQueryOption(id));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération de la dépense:", {
                description: query.error.message,
            });
        }
    }, [query.isError, query.error]);

    return query;
};

//3- Fonction pour précharger un utilisateur
export const prefetchDepenseQuery = (
    id: string
) => {
    return queryClient.prefetchQuery(depenseQueryOption(id));
}
