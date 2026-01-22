import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { investissementKeyQuery } from './index.query';
import { toast } from 'sonner';
import { obtenirTousInvestissementsAction } from '../../actions/investissement.action';
import { IInvestissementParams } from '../../types/revenus.types';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const investissementListQueryOption = (investissementParamsDTO: IInvestissementParams) => {
    return {
        queryKey: investissementKeyQuery("list", investissementParamsDTO),
        queryFn: async () => {
            const result = await obtenirTousInvestissementsAction(investissementParamsDTO);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data!;
        },
        placeholderData: (previousData: any) => previousData,
        staleTime: 30 * 1000, // 30 secondes
        refetchOnWindowFocus: false, // Ne pas refetch lors du focus de la fenêtre
        refetchOnMount: true, // Refetch lors du mount
        // Ajoutez ces options pour mieux gérer les re-renders
        keepPreviousData: true,
        retry: 1,
    };
};

//2- Hook pour récupérer les investissements
export const useInvestissementListQuery = (
    investissementParamsDTO: IInvestissementParams
) => {
    const query = useQuery({
        ...investissementListQueryOption(investissementParamsDTO),
        // S'assurer que la query se réexécute quand les paramètres changent
        enabled: !!investissementParamsDTO, // ou une condition plus spécifique
    });

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des investissements", {
                description: query.error.message,
            });
        }
    }, [query.isError, query.error]);

    return query;
};

//3- Fonction pour précharger les investissements appelée dans les pages
export const prefetchInvestissementListQuery = (
    investissementParamsDTO: IInvestissementParams
) => {
    return queryClient.prefetchQuery(investissementListQueryOption(investissementParamsDTO));
}