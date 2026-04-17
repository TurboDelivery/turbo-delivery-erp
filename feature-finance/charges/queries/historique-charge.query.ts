import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { historiqueChargeAPI } from '../apis/historique-charge.api';
import { IHistoriqueChargeParams } from '../types/historique-charge.type';

const historiqueChargeKey = (params: IHistoriqueChargeParams) => ['historique-charges', params] as const;

export const useHistoriqueChargesQuery = (params: IHistoriqueChargeParams, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: historiqueChargeKey(params),
    queryFn: () => historiqueChargeAPI.obtenirHistoriqueCharges(params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error("Erreur lors de la récupération de l'historique des charges", {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
