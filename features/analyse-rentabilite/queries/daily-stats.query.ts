import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { obtenirDailyStatsAction } from '@/features/analyse-rentabilite/actions/daily-stats.action';
import { IDailyStatsParams } from '@/features/analyse-rentabilite/types/daily-stats.type';

// 1 - Clé de cache
export const dailyStatsQueryKey = (params: IDailyStatsParams) => [
  'daily-stats',
  params.debut,
  params.fin,
];

// 2 - Hook de requête
export const useDailyStatsQuery = (params: IDailyStatsParams) => {
  const query = useQuery({
    queryKey: dailyStatsQueryKey(params),
    queryFn: async () => {
      const result = await obtenirDailyStatsAction(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des stats journalières', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
