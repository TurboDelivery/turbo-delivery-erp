import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { pretKeyQuery } from './index.query';
import { obtenirPretAction } from '../../actions/recouvrement/prets.action';

const queryClient = getQueryClient();


//1- Option de requête
export const pretQueryOption = (id: string) => {
    return {
        queryKey: pretKeyQuery("detail", id),
        queryFn: async () => {
            if (!id) throw new Error("L'identifiant pret est requis");

            const result = await obtenirPretAction(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled: !!id,
    };
};

//2- Hook pour récupérer un pret
export const usePretQuery = (id: string) => {
    const query = useQuery(pretQueryOption(id));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération du pret:", {
                description: query.error.message,
            });
        }
    }, [query.isError, query.error]);

    return query;
};

//3- Fonction pour précharger un pret
export const prefetchPretQuery = (
    id: string
) => {
    return queryClient.prefetchQuery(pretQueryOption(id));
}
