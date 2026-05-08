'use client';

import { useState, useMemo } from 'react';
import { IVerrouillageParams } from '../types/tickets-v2.type';
import { useTicketsAuthentifiesQuery, useTicketsV1ValideQuery } from '../queries/tickets-v2-list.query';
import { useValiderV1Mutation } from '../queries/tickets-v2.mutation';
import { applyTicketFilters, DEFAULT_TICKET_FILTERS, TicketFilters } from '@/components/validation-tickets/TicketFilterBar';

export default function useVerrouillageV2() {
  const [params] = useState<IVerrouillageParams>({});
  const [isLockingAll, setIsLockingAll] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_TICKET_FILTERS);

  const { data: readyData, isLoading: isLoadingReady, fetchNextPage: fetchNextReady, hasNextPage: hasNextReady } = useTicketsAuthentifiesQuery(params);
  const { data: lockedData, isLoading: isLoadingLocked, fetchNextPage: fetchNextLocked, hasNextPage: hasNextLocked } = useTicketsV1ValideQuery(params);

  const readyTickets = useMemo(() => readyData?.pages.flatMap((p) => p.content) ?? [], [readyData]);
  const lockedTickets = useMemo(() => lockedData?.pages.flatMap((p) => p.content) ?? [], [lockedData]);

  const filteredReadyTickets = useMemo(() => applyTicketFilters(readyTickets, filters), [readyTickets, filters]);
  const filteredLockedTickets = useMemo(() => applyTicketFilters(lockedTickets, filters), [lockedTickets, filters]);

  const { mutate: validerV1, mutateAsync: validerV1Async, isPending: isLocking } = useValiderV1Mutation();

  const handleLock = (ticketId: string) => validerV1(ticketId);

  const handleLockAll = async () => {
    if (readyTickets.length === 0) return;
    setIsLockingAll(true);
    try {
      for (const ticket of readyTickets) {
        await validerV1Async(ticket.commandeId);
      }
    } finally {
      setIsLockingAll(false);
    }
  };

  return {
    readyTickets,
    lockedTickets,
    filteredReadyTickets,
    filteredLockedTickets,
    filters,
    setFilters,
    isLoadingReady,
    isLoadingLocked,
    isLocking,
    isLockingAll,
    fetchNextReady,
    hasNextReady,
    fetchNextLocked,
    hasNextLocked,
    handleLock,
    handleLockAll,
  };
}
