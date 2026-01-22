import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { pretKeyQuery } from './index.query';
import { toast } from 'sonner';
import { obtenirTousPretsAction } from '../../actions/recouvrement/prets.action';
import { IFactureParams } from '../../types/recouvrement/prets.types';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const pretListQueryOption = (pretParamsDTO: IFactureParams) => {
    return {
        queryKey: pretKeyQuery("list", pretParamsDTO),
        queryFn: async () => {
            const result = await obtenirTousPretsAction(pretParamsDTO);
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
export const usePretListQuery = (
    pretParamsDTO: IFactureParams
) => {
    const query = useQuery(pretListQueryOption(pretParamsDTO));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des prêts:", {
                description: query.error.message,
            });
        }
    }, [query]);

    return query;
};

//3- Fonction pour précharger les prêts appelée dans les pages
export const prefetchPretListQuery = (
    pretParamsDTO: IFactureParams
) => {
    return queryClient.prefetchQuery(pretListQueryOption(pretParamsDTO));
}