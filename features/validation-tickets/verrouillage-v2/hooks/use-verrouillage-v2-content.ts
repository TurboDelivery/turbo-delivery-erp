'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTicketsV1ValideQuery, useCreneauTicketStatsQuery } from '../queries/tickets-v2-list.query';
import { useValiderV2Mutation, useValiderV2EnMasseMutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';
import { applyTicketFilters, DEFAULT_TICKET_FILTERS, TicketFilters } from '@/components/validation-tickets/TicketFilterBar';

export function useVerrouillageV2Content() {
  const { data, isLoading } = useTicketsV1ValideQuery();
  const { data: creneauActif } = useCreneauActifQuery();
  const { data: ticketStats, isLoading: isStatsLoading } = useCreneauTicketStatsQuery();
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_TICKET_FILTERS);

  const { mutate: validerV2, isPending: isValidating } = useValiderV2Mutation();
  const { mutate: validerV2EnMasse, isPending: isValidatingAll } = useValiderV2EnMasseMutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();

  const tickets = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );

  const filteredTickets = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters]);

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
