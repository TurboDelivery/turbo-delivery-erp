'use client';

import { useState, useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { IVerrouillageParams } from '../types/tickets-v2.type';
import { useTicketsAuthentifiesQuery, useTicketsV1ValideQuery } from '../queries/tickets-v2-list.query';
import { useValiderV1Mutation } from '../queries/tickets-v2.mutation';
import { applyTicketFilters, SelectOption } from '@/components/validation-tickets/TicketFilterBar';
import { validationTicketFiltersConfig, validationTicketFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';

export default function useVerrouillageV2() {
  const [params] = useState<IVerrouillageParams>({});
  const [isLockingAll, setIsLockingAll] = useState(false);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);

  const { data: readyData, isLoading: isLoadingReady, fetchNextPage: fetchNextReady, hasNextPage: hasNextReady } = useTicketsAuthentifiesQuery(params);
  const { data: lockedData, isLoading: isLoadingLocked, fetchNextPage: fetchNextLocked, hasNextPage: hasNextLocked } = useTicketsV1ValideQuery(params);

  const readyTickets = useMemo(() => readyData?.pages.flatMap((p) => p.content) ?? [], [readyData]);
  const lockedTickets = useMemo(() => lockedData?.pages.flatMap((p) => p.content) ?? [], [lockedData]);

  const filteredReadyTickets = useMemo(() => applyTicketFilters(readyTickets, filters), [readyTickets, filters]);
  const filteredLockedTickets = useMemo(() => applyTicketFilters(lockedTickets, filters), [lockedTickets, filters]);

  const livreurOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    return [...readyTickets, ...lockedTickets]
      .filter((t) => t.livreurId && !seen.has(t.livreurId) && seen.add(t.livreurId))
      .map((t) => ({ value: t.livreurId, label: t.livreur }));
  }, [readyTickets, lockedTickets]);

  const restaurantOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    return [...readyTickets, ...lockedTickets]
      .filter((t) => t.restaurantId && !seen.has(t.restaurantId) && seen.add(t.restaurantId))
      .map((t) => ({ value: t.restaurantId, label: t.restaurant }));
  }, [readyTickets, lockedTickets]);

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
    livreurOptions,
    restaurantOptions,
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
