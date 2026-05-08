'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { useTicketsV1ValideQuery, useCreneauTicketStatsQuery } from '../queries/tickets-v2-list.query';
import { useValiderV2Mutation, useValiderV2EnMasseMutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';
import { applyTicketFilters, SelectOption } from '@/components/validation-tickets/TicketFilterBar';
import { validationTicketFiltersConfig, validationTicketFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';

export function useVerrouillageV2Content() {
  const { data, isLoading } = useTicketsV1ValideQuery();
  const { data: creneauActif } = useCreneauActifQuery();
  const { data: ticketStats, isLoading: isStatsLoading } = useCreneauTicketStatsQuery();
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);

  const { mutate: validerV2, isPending: isValidating } = useValiderV2Mutation();
  const { mutate: validerV2EnMasse, isPending: isValidatingAll } = useValiderV2EnMasseMutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();

  const tickets = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );

  const filteredTickets = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters]);

  const livreurOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    return tickets
      .filter((t) => t.livreurId && !seen.has(t.livreurId) && seen.add(t.livreurId))
      .map((t) => ({ value: t.livreurId, label: t.livreur }));
  }, [tickets]);

  const restaurantOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    return tickets
      .filter((t) => t.restaurantId && !seen.has(t.restaurantId) && seen.add(t.restaurantId))
      .map((t) => ({ value: t.restaurantId, label: t.restaurant }));
  }, [tickets]);

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
    filteredTickets,
    filters,
    setFilters,
    livreurOptions,
    restaurantOptions,
    isLoading,
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
