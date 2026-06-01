'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { commissionAPI } from './commission.api';
import { IModifierCommissionPayload } from './commission.types';

export const commissionKeys = {
  all: ['commission-versions'] as const,
  historique: (restaurantId: string) => [...commissionKeys.all, restaurantId] as const,
};

export function useCommissionHistoryQuery(restaurantId: string) {
  return useQuery({
    queryKey: commissionKeys.historique(restaurantId),
    queryFn: () => commissionAPI.historique(restaurantId),
    enabled: !!restaurantId,
    staleTime: 60 * 1000,
  });
}

export function useModifierCommissionMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (payload: IModifierCommissionPayload) =>
      commissionAPI.modifier(restaurantId, payload, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.historique(restaurantId) });
    },
  });
}
