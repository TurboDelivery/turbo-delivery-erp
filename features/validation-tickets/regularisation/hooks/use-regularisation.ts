'use client';

import { useMemo, useState } from 'react';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { useRegularisationListQuery } from '@/features/validation-tickets/regularisation/queries/regularisation-list.query';
import { useApprouverRegularisationMutation, useRejeterRegularisationMutation } from '@/features/validation-tickets/regularisation/queries/regularisation.mutation';
import { applyTicketFilters, DEFAULT_TICKET_FILTERS, TicketFilters } from '@/components/validation-tickets/TicketFilterBar';

export default function useRegularisation() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_TICKET_FILTERS);

  const { data, isLoading, isError } = useRegularisationListQuery();

  const tickets: BonLivraisonTerminee[] = useMemo(() => data?.content ?? [], [data]);

  const filteredTickets = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters]);

  const selectedTicket = tickets.find((t) => t.commandeId === selectedId) ?? null;

  const { mutate: approuver, isPending: isApproving } = useApprouverRegularisationMutation();
  const { mutate: rejeter, isPending: isRejecting } = useRejeterRegularisationMutation();

  const handleApprove = (id: string) => {
    approuver(id, {
      onSuccess: () => {
        const remaining = tickets.filter((t) => t.commandeId !== id);
        setSelectedId(remaining[0]?.commandeId ?? null);
      },
    });
  };

  const handleReject = (id: string, motif: string) => {
    rejeter({ id, motif }, {
      onSuccess: () => {
        const remaining = tickets.filter((t) => t.commandeId !== id);
        setSelectedId(remaining[0]?.commandeId ?? null);
      },
    });
  };

  return {
    tickets,
    filteredTickets,
    filters,
    setFilters,
    selectedId,
    selectedTicket,
    isLoading,
    isError,
    isApproving,
    isRejecting,
    setSelectedId,
    handleApprove,
    handleReject,
  };
}
