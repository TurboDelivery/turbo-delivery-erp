// import React from 'react';

// import {
//     useQuery,
// } from '@tanstack/react-query';
// import getQueryClient from '@/lib/get-query-client';
// import { depenseKeyQuery } from './index.query';
// import { toast } from 'sonner';
// import { obtenirStatsDepensesAction } from '../actions/depense.action';

// const queryClient = getQueryClient();

// //1- Option de requête
// export const depenseStatsQueryOption = () => {
//     return {
//         queryKey: depenseKeyQuery("stats"),
//         queryFn: async () => {
//             const result = await obtenirStatsDepensesAction();
//             if (!result.success) {
//                 throw new Error(result.error);
//             }
//             return result.data!;
//         },

//         placeholderData: (previousData: any) => previousData,
//         staleTime: 5 * 60 * 1000,//5 minutes
//     };
// };

// //2- Hook pour récupérer les stats dé   penses
// export const useDepenseStatsQuery = () => {
//     const query = useQuery(depenseStatsQueryOption());

//     // Gestion des erreurs dans le hook
//     React.useEffect(() => {
//         if (query.isError && query.error) {
//             toast.error("Erreur lors de la récupération des stats dépenses:", {
//                 description: query.error.message,
//             });
//         }
//     }, [query]);

//     return query;
// };

// //3- Fonction pour précharger les stats utilisateurs
// export const prefetchDepenseStatsQuery = () => {
//     return queryClient.prefetchQuery(depenseStatsQueryOption());
// }