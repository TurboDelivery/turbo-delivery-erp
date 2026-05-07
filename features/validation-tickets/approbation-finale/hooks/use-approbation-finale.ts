'use client';

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';
import { getGrillePaiementApi } from '@/features/validation-tickets/grille-de-paiement/apis/grille-paiement.api';
import { useApprobationFinaleQuery } from '../queries/approbation-finale.query';
import { approbationFinaleWaveColumns } from '../components/approbation-finale-wave-columns';

export default function useApprobationFinale() {
  const { data: creneauActif, isLoading: isLoadingCreneau } = useCreneauActifQuery();

  const {
    data: grillePages,
    isLoading: isLoadingGrille,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['grille-paiement-approbation', creneauActif?.id] as const,
    queryFn: ({ pageParam = 0 }) =>
      getGrillePaiementApi({ creneauId: creneauActif!.id, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page + 1 < totalPages ? page + 1 : undefined;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!creneauActif?.id,
  });

  const { data: approbation } = useApprobationFinaleQuery(creneauActif?.id);

  const grilleMeta = useMemo(() => grillePages?.pages[0] ?? null, [grillePages]);

  const lignes = useMemo(
    () => grillePages?.pages.flatMap((p) => p?.lignes ?? []) ?? [],
    [grillePages],
  );

  const waveTable = useReactTable({
    data: lignes,
    columns: approbationFinaleWaveColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return {
    creneauActif,
    grilleMeta,
    waveTable,
    approbation,
    isLoading: isLoadingCreneau || isLoadingGrille,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    soumisAuPdg: creneauActif?.statut === 'SOUMIS_PDG',
  };
}
