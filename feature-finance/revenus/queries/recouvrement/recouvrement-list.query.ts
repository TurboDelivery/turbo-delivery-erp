import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { recouvrementKeyQuery } from './index.query';
import { toast } from 'sonner';
import { IRecouvrementParams } from '../../types/recouvrement/recouvrement.types';
import { obtenirTousRecouvrementsAction } from '../../actions/recouvrement/recouvrement.action';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const recouvrementListQueryOption = (recouvrementParamsDTO: IRecouvrementParams) => {
    return {
        queryKey: recouvrementKeyQuery("list", recouvrementParamsDTO),
        queryFn: async () => {
            const result = await obtenirTousRecouvrementsAction(recouvrementParamsDTO);
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

//2- Hook pour récupérer les recouvrements
export const useRecouvrementListQuery = (
    recouvrementParamsDTO: IRecouvrementParams
) => {
    const query = useQuery(recouvrementListQueryOption(recouvrementParamsDTO));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des recouvrements:", {
                description: query.error.message,
            });
        }
    }, [query]);

    return query;
};

//3- Fonction pour précharger les recouvrements appelée dans les pages
export const prefetchRecouvrementListQuery = (
    recouvrementParamsDTO: IRecouvrementParams
) => {
    return queryClient.prefetchQuery(recouvrementListQueryOption(recouvrementParamsDTO));
}