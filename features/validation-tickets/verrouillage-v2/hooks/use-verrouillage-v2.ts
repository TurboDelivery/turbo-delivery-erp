'use client';

import { useState, useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { IVerrouillageParams } from '../types/tickets-v2.type';
import { useTicketsAuthentifiesQuery, useTicketsV1ValideQuery } from '../queries/tickets-v2-list.query';
import { useValiderV1Mutation } from '../queries/tickets-v2.mutation';
import { validationTicketFiltersConfig, validationTicketFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';
import { useTicketFilterOptions } from '@/features/validation-tickets/hooks/use-ticket-filter-options';

export default function useVerrouillageV2() {
  const [isLockingAll, setIsLockingAll] = useState(false);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);

  const params = useMemo<IVerrouillageParams>(() => ({
    debut: filters.debut || undefined,
    fin: filters.fin || undefined,
    restaurantId: filters.restaurantId || undefined,
    livreurId: filters.livreurId || undefined,
    search: filters.search || undefined,
  }), [filters.debut, filters.fin, filters.restaurantId, filters.livreurId, filters.search]);

  const { data: readyData, isLoading: isLoadingReady, fetchNextPage: fetchNextReady, hasNextPage: hasNextReady, isFetchingNextPage: isFetchingNextReady } = useTicketsAuthentifiesQuery(params);
  const { data: lockedData, isLoading: isLoadingLocked, fetchNextPage: fetchNextLocked, hasNextPage: hasNextLocked, isFetchingNextPage: isFetchingNextLocked } = useTicketsV1ValideQuery(params);
  const { livreurOptions } = useTicketFilterOptions();

  const readyTickets = useMemo(() => readyData?.pages.flatMap((p) => p.content) ?? [], [readyData]);
  const lockedTickets = useMemo(() => lockedData?.pages.flatMap((p) => p.content) ?? [], [lockedData]);

  const totalReady = readyData?.pages[0]?.totalElements ?? 0;
  const totalLocked = lockedData?.pages[0]?.totalElements ?? 0;

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
    totalReady,
    totalLocked,
    filters,
    setFilters,
    livreurOptions,
    isLoadingReady,
    isLoadingLocked,
    isLocking,
    isLockingAll,
    fetchNextReady,
    hasNextReady,
    isFetchingNextReady,
    fetchNextLocked,
    hasNextLocked,
    isFetchingNextLocked,
    handleLock,
    handleLockAll,
  };
}
