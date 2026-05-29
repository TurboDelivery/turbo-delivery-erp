'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getCreneauxListApi } from '@/features/creneaux/apis/creneau.api';
import type { PaginatedResponse } from '@/types/general';
import type { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';

export const historiqueCreneauxKeys = {
  all: ['historique-creneaux'] as const,
  list: (size: number, lotStatut?: string) =>
    [...historiqueCreneauxKeys.all, 'list', size, lotStatut ?? 'tous'] as const,
};

export function useHistoriqueCreneauxListQuery(params?: { size?: number; lotStatut?: string }) {
  const size = params?.size ?? 20;
  const lotStatut = params?.lotStatut;
  return useInfiniteQuery({
    queryKey: historiqueCreneauxKeys.list(size, lotStatut),
    // V59 (2026-05-29) — includeInactifs=true : c'est la surface admin de
    // gestion des créneaux (colonne "Visible"). On doit voir les créneaux
    // masqués pour pouvoir les réafficher, contrairement aux pickers UI.
    queryFn: ({ pageParam = 0 }): Promise<PaginatedResponse<ICreneauActifVm>> =>
      getCreneauxListApi({ page: pageParam as number, size, lotStatut, includeInactifs: true }).then(
        (d) => d ?? ({ content: [], totalElements: 0, totalPages: 0, number: 0 } as unknown as PaginatedResponse<ICreneauActifVm>),
      ),
    getNextPageParam: (lastPage) =>
      lastPage.number + 1 < lastPage.totalPages ? lastPage.number + 1 : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
