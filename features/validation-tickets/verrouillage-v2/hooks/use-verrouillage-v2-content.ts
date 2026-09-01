'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { useTicketsV1ValideQuery, useTicketsV2ValideQuery, useCreneauTicketStatsQuery } from '../queries/tickets-v2-list.query';
import { useValiderV2Mutation, useValiderV2EnMasseMutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';
import { validationTicketFiltersConfig, validationTicketFiltersOptions, validationTicketV2ValideFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';
import { useTicketFilterOptions } from '@/features/validation-tickets/hooks/use-ticket-filter-options';
import type { IVerrouillageParams } from '../types/tickets-v2.type';
import { sansDoublons } from '../utils/sans-doublons';

export function useVerrouillageV2Content() {
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);
  const [v2ValideFilters, setV2ValideFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketV2ValideFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);
  const setV2ValideFilters = (v: typeof v2ValideFilters) => void setV2ValideFiltersRaw(v);

  const params = useMemo<IVerrouillageParams>(() => ({
    debut: filters.debut || undefined,
    fin: filters.fin || undefined,
    restaurantId: filters.restaurantId || undefined,
    livreurId: filters.livreurId || undefined,
    search: filters.search || undefined,
    numero: filters.numero || undefined,
  }), [filters.debut, filters.fin, filters.restaurantId, filters.livreurId, filters.search, filters.numero]);

  const v2ValideParams = useMemo<IVerrouillageParams>(() => ({
    debut: v2ValideFilters.debut || undefined,
    fin: v2ValideFilters.fin || undefined,
    restaurantId: v2ValideFilters.restaurantId || undefined,
    livreurId: v2ValideFilters.livreurId || undefined,
    search: v2ValideFilters.search || undefined,
    numero: v2ValideFilters.numero || undefined,
  }), [v2ValideFilters.debut, v2ValideFilters.fin, v2ValideFilters.restaurantId, v2ValideFilters.livreurId, v2ValideFilters.search, v2ValideFilters.numero]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useTicketsV1ValideQuery(params);
  const {
    data: v2ValideData,
    isLoading: isLoadingV2Valide,
    isError: isErrorV2Valide,
    refetch: refetchV2Valide,
    fetchNextPage: fetchNextV2Valide,
    hasNextPage: hasNextV2Valide,
    isFetchingNextPage: isFetchingNextV2Valide,
  } = useTicketsV2ValideQuery(v2ValideParams);
  const { data: creneauActif } = useCreneauActifQuery();
  // Les deux AUTRES requetes de ce hook exposent leur `isError` ; celle-ci ne le faisait
  // pas. Sur panne, `ticketStats` restait `undefined` et les quatre cartes du bandeau
  // affichaient « — » : indiscernable d'un cycle sans ticket, alors que « Total commandes »
  // et « Total commissions » sont des MONTANTS, a l'etape 4 de la chaine de paiement.
  const {
    data: ticketStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useCreneauTicketStatsQuery();
  const { livreurOptions } = useTicketFilterOptions();

  const { mutate: validerV2, isPending: isValidating } = useValiderV2Mutation();
  const { mutate: validerV2EnMasse, isPending: isValidatingAll } = useValiderV2EnMasseMutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();

  // Même dédoublonnage que sur l'écran V1 : les tickets validés quittent la liste, les pages
  // se décalent, et un ticket déjà chargé réapparaît sur la page suivante.
  const tickets = useMemo(
    () => sansDoublons(data?.pages.flatMap((p) => p.content) ?? []),
    [data],
  );

  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const ticketsV2Valide = useMemo(
    () => sansDoublons(v2ValideData?.pages.flatMap((p) => p.content) ?? []),
    [v2ValideData],
  );

  const totalV2Valide = v2ValideData?.pages[0]?.totalElements ?? 0;

  const handleValidate = useCallback(
    (id: string) => {
      setValidatingId(id);
      validerV2({ ticketId: id }, { onSettled: () => setValidatingId(null) });
    },
    [validerV2],
  );

  const handleReject = useCallback(
    (id: string, motif: string) => {
      rejeterFraude({ id, motif }, { onSuccess: () => setRejectDialogId(null) });
    },
    [rejeterFraude],
  );

  const handleValidateAll = useCallback(() => {
    validerV2EnMasse();
  }, [validerV2EnMasse]);

  return {
    tickets,
    totalElements,
    ticketsV2Valide,
    totalV2Valide,
    isLoadingV2Valide,
    isErrorV2Valide,
    refetchV2Valide,
    fetchNextV2Valide,
    hasNextV2Valide: !!hasNextV2Valide,
    isFetchingNextV2Valide,
    filters,
    setFilters,
    v2ValideFilters,
    setV2ValideFilters,
    livreurOptions,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    ticketStats,
    isStatsLoading,
    isStatsError,
    refetchStats,
    validatingId,
    isValidating,
    isValidatingAll,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    creneauActif,
    handleValidate,
    handleReject,
    handleValidateAll,
  };
}
