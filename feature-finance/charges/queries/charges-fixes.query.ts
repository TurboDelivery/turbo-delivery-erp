import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { IChargeFixeParams } from '../types/charge-fixe.type';
import { chargeFixeKeyQuery } from './index.query';
import { toast } from 'sonner';
import { chargeFixeAPI } from '@/feature-finance/charges/apis/charge-fixe.api';

export const chargesFixesListQueryOption = (params: IChargeFixeParams) => ({
  queryKey: chargeFixeKeyQuery('list', params),
  queryFn: async () => {
    return await chargeFixeAPI.obtenirChargesFixes(params);
  },
  staleTime: 5 * 60 * 1000,
});

export const chargesFixesStatsQueryOption = () => ({
  queryKey: chargeFixeKeyQuery('stats'),
  queryFn: async () => {
    return await chargeFixeAPI.obtenirStatsChargesFixes();
  },
  staleTime: 5 * 60 * 1000,
});

export const useChargesFixesQuery = (params: IChargeFixeParams = {}) => {
  const query = useQuery(chargesFixesListQueryOption(params));

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des charges fixes', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const useChargesFixesStatsQuery = () => {
  const query = useQuery(chargesFixesStatsQueryOption());

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques des charges fixes', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

