'use client';

import { useQuery } from '@tanstack/react-query';
import { getHistoriqueCreneauxAction } from '../actions/historique-creneaux.action';

export const historiqueCreneauxKeys = {
  all: ['historique-creneaux'] as const,
  list: (page: number, size: number) =>
    [...historiqueCreneauxKeys.all, page, size] as const,
};

export function useHistoriqueCreneauxListQuery(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: historiqueCreneauxKeys.list(params?.page ?? 0, params?.size ?? 20),
    queryFn: () => getHistoriqueCreneauxAction(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
