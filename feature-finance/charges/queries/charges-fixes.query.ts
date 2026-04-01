import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { obtenirChargesFixesAction } from '../actions/charge-fixe.action';
import { IChargeFixeParams } from '../types/charge-fixe.type';
import { chargeFixeKeyQuery } from './index.query';
import { toast } from 'sonner';

export const chargesFixesListQueryOption = (params: IChargeFixeParams) => ({
  queryKey: chargeFixeKeyQuery('list', params),
  queryFn: async () => {
    const result = await obtenirChargesFixesAction(params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  },
  staleTime: 5 * 60 * 1000,
});

export const useChargesFixesQuery = (params: IChargeFixeParams) => {
  const query = useQuery(chargesFixesListQueryOption(params));

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des charges fixes', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
