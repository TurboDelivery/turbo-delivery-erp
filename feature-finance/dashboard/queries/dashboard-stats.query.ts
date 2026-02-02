import React from 'react';
import {
    useQuery,
} from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { toast } from 'sonner';
import { DashboardStatsParams } from '../types/dashboard.types';
import { getDashboardStatsAction } from '../actions/dashboard.action';

const queryClient = getQueryClient();

// Clé de query pour les statistiques dashboard
export const dashboardStatsQueryKey = (params: DashboardStatsParams) => ['dashboard-stats', params];

// Option de requête pour les statistiques dashboard
export const dashboardStatsQueryOption = (params: DashboardStatsParams) => {
    return {
        queryKey: dashboardStatsQueryKey(params),
        queryFn: async () => {
            const result = await getDashboardStatsAction(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    };
};

// Hook pour récupérer les statistiques dashboard
export const useDashboardStatsQuery = (params: DashboardStatsParams) => {
    const query = useQuery(dashboardStatsQueryOption(params));

    // Gestion des erreurs dans le hook
    React.useEffect(() => {
        if (query.isError && query.error) {
            toast.error("Erreur lors de la récupération des statistiques:", {
                description: query.error instanceof Error ? query.error.message : "Erreur inconnue",
            });
        }
    }, [query]);

    return query;
};

// Fonction pour précharger les statistiques dashboard
export const prefetchDashboardStatsQuery = (params: DashboardStatsParams) => {
    return queryClient.prefetchQuery(dashboardStatsQueryOption(params));
};
