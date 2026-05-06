'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ChargeTypeFilter } from '../hooks/use-paiements-table';
import { chargeFixeKeyQuery } from '@/feature-finance/charges/queries/index.query';
import { chargeVariableKeyQuery } from '@/feature-finance/charges/queries/index-charge-variable.query';

const DECAISSER_ENDPOINT: Record<ChargeTypeFilter, string> = {
  fixe: '/erp/charges-fixes',
  variable: '/erp/charges-variables',
};

export const useDecaisserMutation = (chargeType: ChargeTypeFilter, fin?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const base = DECAISSER_ENDPOINT[chargeType];
      const data = chargeType === 'fixe' && fin ? { date: fin } : undefined;
      await Promise.all(
        ids.map((id) =>
          api.request({ endpoint: `${base}/${id}/payer`, method: 'PATCH', data }),
        ),
      );
    },
    onSuccess: async (_data, ids) => {
      const key = chargeType === 'fixe' ? chargeFixeKeyQuery() : chargeVariableKeyQuery();
      await queryClient.invalidateQueries({ queryKey: key, exact: false });
      await queryClient.refetchQueries({ queryKey: key, type: 'active' });
      toast.success(`${ids.length > 1 ? 'Charges décaissées' : 'Charge décaissée'} avec succès`);
    },
    onError: (error) => {
      toast.error('Erreur lors du décaissement', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
