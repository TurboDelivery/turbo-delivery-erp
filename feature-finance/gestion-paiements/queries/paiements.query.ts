import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paiementAPI } from '../apis/paiement.api';
import { IPaiementParams } from '../types/paiement.type';
import { paiementKeyQuery } from './index.query';

export const paiementsListQueryOption = (params: IPaiementParams) => ({
  queryKey: paiementKeyQuery('list', params),
  queryFn: async () => paiementAPI.obtenirPaiements(params),
  staleTime: 5 * 60 * 1000,
});

export const paiementsStatsQueryOption = (mois?: string) => ({
  queryKey: paiementKeyQuery('stats', mois),
  queryFn: async () => paiementAPI.obtenirStats(mois),
  staleTime: 5 * 60 * 1000,
});

export const usePaiementsQuery = (params: IPaiementParams = {}) => {
  const query = useQuery(paiementsListQueryOption(params));

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des paiements', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const usePaiementsStatsQuery = (mois?: string) => {
  const query = useQuery(paiementsStatsQueryOption(mois));

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
