import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paiementAPI } from '../apis/paiement.api';
import { paiementKeyQuery } from './index.query';

export const useDecaissementStatsQuery = (params?: { debut?: string; fin?: string }) => {
  const query = useQuery({
    queryKey: paiementKeyQuery('decaissement-stats', params),
    queryFn: () => paiementAPI.obtenirDecaissementStats(params),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques de décaissement', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
