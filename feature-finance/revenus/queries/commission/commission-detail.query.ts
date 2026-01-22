import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { obtenirCommissionAction } from '../../actions/commission.action';
import { commissionKeyQuery } from './index.query';

const queryClient = getQueryClient();


//1- Option de requête
export const commissionQueryOption = (id: string) => {
    return {
        queryKey: commissionKeyQuery("detail", id),
        queryFn: async () => {
            if (!id) throw new Error("L'identifiant commission est requis");

            const result = await obtenirCommissionAction(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled: !!id,
    };
};

//2- Hook pour récupérer un investissement
export const useCommissionQuery = (id: string) => {
    const query = useQuery(commissionQueryOption(id));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération de l'investissement:", {
                description: query.error.message,
            });
        }
    }, [query.isError, query.error]);

    return query;
};

//3- Fonction pour précharger un investissement
export const prefetchInvestissementQuery = (
    id: string
) => {
    return queryClient.prefetchQuery(commissionQueryOption(id));
}
