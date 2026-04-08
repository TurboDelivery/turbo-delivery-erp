import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { obtenirChargesVariablesAction } from '../actions/charge-variable.action';
import { IChargeVariableParams } from '../types/charge-variable.type';
import { chargeVariableKeyQuery } from './index-charge-variable.query';
import { toast } from 'sonner';

export const chargesVariablesListQueryOption = (params: IChargeVariableParams) => ({
  queryKey: chargeVariableKeyQuery('list', params),
  queryFn: async () => {
    const result = await obtenirChargesVariablesAction(params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  },
  staleTime: 5 * 60 * 1000,
});

export const useChargesVariablesQuery = (params: IChargeVariableParams, enabled: boolean = true) => {
  const query = useQuery({ ...chargesVariablesListQueryOption(params), enabled });

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des charges variables', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
