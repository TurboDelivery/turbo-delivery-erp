import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { recouvrementKeyQuery } from './index.query';
import { obtenirRecouvrementDetailAction } from '../../actions/recouvrement/recouvrement.action';

const queryClient = getQueryClient();


//1- Option de requête
export const recouvrementQueryOption = (id: string) => {
    return {
        queryKey: recouvrementKeyQuery("detail", id),
        queryFn: async () => {
            if (!id) throw new Error("L'identifiant recouvrement est requis");

            const result = await obtenirRecouvrementDetailAction(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled: !!id,
    };
};

//2- Hook pour récupérer un investissement
export const useRecouvrementQuery = (id: string) => {
    const query = useQuery(recouvrementQueryOption(id));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération du recouvrement:", {
                description: query.error.message,
            });
        }
    }, [query.isError, query.error]);

    return query;
};

//3- Fonction pour précharger un investissement
export const prefetchRecouvrementQuery = (
    id: string
) => {
    return queryClient.prefetchQuery(recouvrementQueryOption(id));
}
