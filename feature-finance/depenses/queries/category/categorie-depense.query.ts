import React from 'react';

import {
    useQuery,
} from '@tanstack/react-query';
import { obtenirCategoriesDepensesAction } from '../../actions/categorie-depense.action';
import { categorieDepenseKeyQuery } from './index.query';
import { toast } from 'sonner';
import { ICategorieDepenseParams } from '../../types/categorie-depense.type';
import getQueryClient from '@/lib/get-query-client';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const categorieDepenseListQueryOption = ({ params }: { params: ICategorieDepenseParams }) => {
    return {
        queryKey: categorieDepenseKeyQuery("list"),
        queryFn: async () => {
            const result = await obtenirCategoriesDepensesAction(params);
            if (!result.success) {
                throw new Error(result.error || "Erreur lors de la récupération des dépenses");
            }
            return result.data!;
        },
        placeholderData: (previousData: any) => previousData,
        staleTime: 30 * 1000,//30 secondes
        refetchOnWindowFocus: false,//Ne pas refetch lors du focus de la fenetre
        refetchOnMount: true,//Refetch lors du mount
    };
};

//2- Hook pour récupérer les dépenses
export const useCategorieDepensesListQuery = ({ params }: { params: ICategorieDepenseParams }) => {
    const query = useQuery(categorieDepenseListQueryOption({ params }));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des dépenses:", {
                description: query.error.message,
            });
        }
    }, [query]);

    return query;
};

//3- Fonction pour précharger les dépenses appelée dans les pages
export const prefetchCategoriesDepensesListQuery = ({ params }: { params: ICategorieDepenseParams }) => {
    return queryClient.prefetchQuery(categorieDepenseListQueryOption({ params }));
}