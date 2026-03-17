import getQueryClient from '@/lib/get-query-client';
import { IDashboardStatsResponse, IPersonnelStatsParams } from '@/features/dashboard/types/personnel.types';
import { dashboardKeyQuery } from '@/features/dashboard/queries/index.query';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';

const queryClient = getQueryClient();

export const personnelStatsQueryOption = (params: IPersonnelStatsParams) => {
  return {
    queryKey: dashboardKeyQuery('personnel-stats', params),
    queryFn: async () => {
      return await api.request<IDashboardStatsResponse>({
        endpoint: '/finance/personal/stats',
        method: 'GET',
        searchParams: {
          debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
          fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
        },
      });
    },
    staleTime: 60 * 1000,
  }
}

export const usePersonnelStatsQuery = (params: IPersonnelStatsParams) => {
  const query = useQuery(personnelStatsQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques:', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
}

export const prefetchPersonnelStatsQuery = (params: IPersonnelStatsParams) => {
  return queryClient.prefetchQuery(personnelStatsQueryOption(params));
}