// import React from 'react';

// import {
//     useQuery,
// } from '@tanstack/react-query';
// import getQueryClient from '@/lib/get-query-client';
// import { toast } from 'sonner';
// import { ILivraisonParams, IPaginatedLivraisonResponse } from '../../types/livraison.types';
// import { obtenirTousLivraisonsAction } from '../../actions/livraison.action';
// import { livraisonKeyQuery } from './index.query';

// const queryClient = getQueryClient();

// // Option de requête pour la réponse paginée complète
// export const livraisonPaginatedQueryOption = (livraisonParamsDTO: ILivraisonParams) => {
//     return {
//         queryKey: livraisonKeyQuery("paginated", livraisonParamsDTO),
//         queryFn: async () => {
//             const result = await obtenirTousLivraisonsAction(livraisonParamsDTO);
//             if (!result.success) {
//                 throw new Error(result.error);
//             }
//             return result.data as IPaginatedLivraisonResponse;
//         },
//         placeholderData: (previousData: any) => previousData,
//         staleTime: 30 * 1000,//30 secondes
//         refetchOnWindowFocus: false,//Ne pas refetch lors du focus de la fenetre
//         refetchOnMount: true,//Refetch lors du mount
//     };
// };

// // Hook pour récupérer les livraisons avec pagination complète
// export const useLivraisonPaginatedQuery = (
//     livraisonParamsDTO: ILivraisonParams
// ) => {
//     const query = useQuery(livraisonPaginatedQueryOption(livraisonParamsDTO));

//     // Gestion des erreurs dans le hook
//     React.useEffect(() => {
//         if (query.isError && query.error) {
//             toast.error("Erreur lors de la récupération des livraisons:", {
//                 description: query.error.message,
//             });
//         }
//     }, [query]);

//     return query;
// };

// // Fonction pour précharger les livraisons paginées
// export const prefetchLivraisonPaginatedQuery = (
//     livraisonParamsDTO: ILivraisonParams
// ) => {
//     return queryClient.prefetchQuery(livraisonPaginatedQueryOption(livraisonParamsDTO));
// }
