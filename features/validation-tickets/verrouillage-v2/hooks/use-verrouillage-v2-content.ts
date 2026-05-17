'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { useTicketsV1ValideQuery, useTicketsV2ValideQuery, useCreneauTicketStatsQuery } from '../queries/tickets-v2-list.query';
import { useValiderV2Mutation, useValiderV2EnMasseMutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';
import { validationTicketFiltersConfig, validationTicketFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';
import { useTicketFilterOptions } from '@/features/validation-tickets/hooks/use-ticket-filter-options';
import type { IVerrouillageParams } from '../types/tickets-v2.type';

export function useVerrouillageV2Content() {
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);

  const params = useMemo<IVerrouillageParams>(() => ({
    debut: filters.debut || undefined,
    fin: filters.fin || undefined,
    restaurantId: filters.restaurantId || undefined,
    livreurId: filters.livreurId || undefined,
    search: filters.search || undefined,
    numero: filters.numero || undefined,
  }), [filters.debut, filters.fin, filters.restaurantId, filters.livreurId, filters.search, filters.numero]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTicketsV1ValideQuery(params);
  const {
    data: v2ValideData,
    isLoading: isLoadingV2Valide,
    fetchNextPage: fetchNextV2Valide,
    hasNextPage: hasNextV2Valide,
    isFetchingNextPage: isFetchingNextV2Valide,
  } = useTicketsV2ValideQuery(params);
  const { data: creneauActif } = useCreneauActifQuery();
  const { data: ticketStats, isLoading: isStatsLoading } = useCreneauTicketStatsQuery();
  const { livreurOptions } = useTicketFilterOptions();

  const { mutate: validerV2, isPending: isValidating } = useValiderV2Mutation();
  const { mutate: validerV2EnMasse, isPending: isValidatingAll } = useValiderV2EnMasseMutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();

  const tickets = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );

  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const ticketsV2Valide = useMemo(
    () => v2ValideData?.pages.flatMap((p) => p.content) ?? [],
    [v2ValideData],
  );

  const totalV2Valide = v2ValideData?.pages[0]?.totalElements ?? 0;

  const handleValidate = useCallback(
    (id: string) => {
      setValidatingId(id);
      validerV2(id, { onSettled: () => setValidatingId(null) });
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
    fetchNextV2Valide,
    hasNextV2Valide: !!hasNextV2Valide,
    isFetchingNextV2Valide,
    filters,
    setFilters,
    livreurOptions,
    isLoading,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    ticketStats,
    isStatsLoading,
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
