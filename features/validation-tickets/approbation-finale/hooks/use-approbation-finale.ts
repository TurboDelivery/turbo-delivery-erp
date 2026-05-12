'use client';

import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import { useCreneauActifQuery, useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { getGrillePaiementApi } from '@/features/validation-tickets/grille-de-paiement/apis/grille-paiement.api';
import {
  useApprobationFinaleQuery,
  useApprouverEtDeclencherWaveMutation,
  useRejeterApprobationFinaleMutation,
} from '../queries/approbation-finale.query';
import { approbationFinaleWaveColumns } from '../components/approbation-finale-wave-columns';

export default function useApprobationFinale() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const { data: creneauActif, isLoading: isLoadingCreneau } = useCreneauActifQuery();

  const [selectedCreneauId, setSelectedCreneauId] = useState<string | undefined>(undefined);
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const resolvedCreneauId = selectedCreneauId ?? creneauActif?.id;
  const resolvedCreneau = selectedCreneauId
    ? (creneaux.find((c) => c.id === selectedCreneauId) ?? creneauActif)
    : creneauActif;

  const {
    data: grillePages,
    isLoading: isLoadingGrille,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['grille-paiement-approbation', resolvedCreneauId] as const,
    queryFn: ({ pageParam = 0 }) =>
      getGrillePaiementApi({ creneauId: resolvedCreneauId!, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page + 1 < totalPages ? page + 1 : undefined;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!resolvedCreneauId,
  });

  const { data: approbation } = useApprobationFinaleQuery(resolvedCreneauId);
  const { mutate: approuver, isPending: isApprouvant } = useApprouverEtDeclencherWaveMutation();
  const { mutate: rejeter, isPending: isRejetant } = useRejeterApprobationFinaleMutation();

  const [approuverOpen, setApprouverOpen] = useState(false);
  const [rejetOpen, setRejetOpen] = useState(false);
  const [motif, setMotif] = useState('');

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

  const handleCreneauChange = useCallback((id: string | undefined) => setSelectedCreneauId(id), []);

  const handleApprouver = () => {
    const lotId = grilleMeta?.lotId;
    if (!lotId || !userId) return;
    approuver({ lotId, userId }, {
      onSuccess: () => setApprouverOpen(false),
    });
  };

  const handleRejeter = () => {
    const lotId = grilleMeta?.lotId;
    if (!lotId || !userId || !motif.trim()) return;
    rejeter(
      { lotId, motif: motif.trim(), userId },
      {
        onSuccess: () => {
          setRejetOpen(false);
          setMotif('');
        },
      },
    );
  };

  return {
    creneauActif: resolvedCreneau,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId: handleCreneauChange,
    grilleMeta,
    waveTable,
    approbation,
    isLoading: isLoadingCreneau || isLoadingGrille,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    soumisAuPdg: resolvedCreneau?.statut === 'SOUMIS_PDG',
    approuverOpen,
    rejetOpen,
    motif,
    setMotif,
    isApprouvant,
    isRejetant,
    openApprouver: () => setApprouverOpen(true),
    closeApprouver: () => setApprouverOpen(false),
    openRejet: () => setRejetOpen(true),
    closeRejet: () => { setRejetOpen(false); setMotif(''); },
    handleApprouver,
    handleRejeter,
  };
}
