import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { ICommissionParams } from '../../types/commission.types';
import { commissionKeyQuery } from './index.query';
import { obtenirTousCommissionsFixeAction } from '../../actions/commission.action';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const commissionFixeListQueryOption = (commissionParamsDTO: ICommissionParams) => {
    return {
        queryKey: commissionKeyQuery("list", commissionParamsDTO),
        queryFn: async () => {
            const result = await obtenirTousCommissionsFixeAction(commissionParamsDTO);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data!;
        },
        placeholderData: (previousData: any) => previousData,
        staleTime: 30 * 1000,//30 secondes
        refetchOnWindowFocus: false,//Ne pas refetch lors du focus de la fenetre
        refetchOnMount: true,//Refetch lors du mount
    };
};

//2- Hook pour récupérer les investissements
export const useCommissionFixeListQuery = (
    commissionParamsDTO: ICommissionParams
) => {
    const query = useQuery(commissionFixeListQueryOption(commissionParamsDTO));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des commissions:", {
                description: query.error.message,
            });
        }
    }, [query]);

    return query;
};

//3- Fonction pour précharger les investissements appelée dans les pages
export const prefetchCommissionFixeListQuery = (
    commissionParamsDTO: ICommissionParams
) => {
    return queryClient.prefetchQuery(commissionFixeListQueryOption(commissionParamsDTO));
}
