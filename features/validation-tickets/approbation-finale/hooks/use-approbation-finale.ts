'use client';

import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import { useCreneauActifQuery, useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { getGrillePaiementApi } from '@/features/validation-tickets/grille-de-paiement/apis/grille-paiement.api';
import {
  useApprouverEtDeclencherWaveMutation,
  useRejeterApprobationFinaleMutation,
} from '../queries/approbation-finale.query';
import { approbationFinaleWaveColumns } from '../components/approbation-finale-wave-columns';

export default function useApprobationFinale() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const {
    data: creneauActif,
    isLoading: isLoadingCreneau,
    isError: isErrorCreneau,
    refetch: refetchCreneau,
  } = useCreneauActifQuery();

  // Deep-link email « Lot visé DGA — approbation finale requise » :
  // /validation-tickets/approbation-finale?creneau=<id> ouvre la bonne semaine
  // (sinon la page retombe sur le créneau actif).
  const [selectedCreneauId, setSelectedCreneauId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get('creneau') ?? undefined;
  });
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const resolvedCreneauId = selectedCreneauId ?? creneauActif?.id;
  const resolvedCreneau = selectedCreneauId
    ? (creneaux.find((c) => c.id === selectedCreneauId) ?? creneauActif)
    : creneauActif;

  const {
    data: grillePages,
    isLoading: isLoadingGrille,
    isError: isErrorGrille,
    isFetching: isFetchingGrille,
    refetch: refetchGrille,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['grille-paiement-approbation', resolvedCreneauId] as const,
    queryFn: ({ pageParam }) =>
      getGrillePaiementApi({ creneauId: resolvedCreneauId!, page: pageParam as number }),
  initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { number, totalPages } = lastPage.lignes;
      return number + 1 < totalPages ? number + 1 : undefined;
    },
    staleTime: 60_000,
    // Pas de `refetchInterval` : écran de visa, non temps réel, et les mutations
    // invalident déjà la clé. C'est de surcroît une requête à défilement infini, donc
    // chaque tick relisait TOUTES les pages déjà chargées.
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!resolvedCreneauId,
  });

  const { mutate: approuver, isPending: isApprouvant } = useApprouverEtDeclencherWaveMutation();
  const { mutate: rejeter, isPending: isRejetant } = useRejeterApprobationFinaleMutation();

  const [approuverOpen, setApprouverOpen] = useState(false);
  const [rejetOpen, setRejetOpen] = useState(false);
  const [motif, setMotif] = useState('');

  const grilleMeta = useMemo(() => grillePages?.pages[0] ?? null, [grillePages]);

  const lignes = useMemo(
    () => grillePages?.pages.flatMap((p) => p?.lignes.content ?? []) ?? [],
    [grillePages],
  );

  const waveTable = useReactTable({
    data: lignes,
    columns: approbationFinaleWaveColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCreneauChange = useCallback((id: string | undefined) => setSelectedCreneauId(id), []);

  const handleApprouver = () => {
    const lotId = grilleMeta?.lot?.id;
    if (!lotId || !userId) return;
    approuver({ lotId, userId }, {
      onSuccess: () => setApprouverOpen(false),
    });
  };

  const handleRejeter = () => {
    const lotId = grilleMeta?.lot?.id;
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
    isLoading: isLoadingCreneau || isLoadingGrille,
    // Sans isError, une API en panne rendait « Aucun dossier en attente d'approbation
    // finale » : le PDG en concluait qu'il n'avait rien a approuver.
    isError: isErrorCreneau || isErrorGrille,
    isFetching: isFetchingGrille,
    refetch: () => {
      // Le creneau conditionne la grille : si c'est lui qui a echoue, la grille est
      // desactivee et seule sa relance peut relancer l'ecran.
      void refetchCreneau();
      void refetchGrille();
    },
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    // Le PDG agit quand le LOT est VALIDE_DGA (visé par le DGA), pas sur un
    // statut créneau. L'ancien test `resolvedCreneau.statut === 'SOUMIS_PDG'`
    // comparait le statut CRÉNEAU (StatutCreneau: OUVERT/VERROUILLE_V2/…)
    // à un libellé fantôme absent de tout enum backend → la barre d'action
    // n'apparaissait JAMAIS (étape 10 cassée). On lit le vrai statut du lot,
    // déjà chargé dans grilleMeta. Backend approuverDg exige VALIDE_DGA.
    soumisAuPdg: grilleMeta?.lot?.statut === 'VALIDE_DGA',
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
