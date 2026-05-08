'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicketReadyList from './TicketReadyList';
import TicketLockedList from './TicketLockedList';
import useVerrouillageV2 from '../hooks/use-verrouillage-v2';
import TicketFilterBar from '@/components/validation-tickets/TicketFilterBar';

export default function VerificationV1Content() {
  const {
    readyTickets,
    filteredReadyTickets,
    filteredLockedTickets,
    filters,
    setFilters,
    livreurOptions,
    restaurantOptions,
    isLockingAll,
    handleLock,
    handleLockAll,
    fetchNextReady,
    hasNextReady,
    isFetchingNextReady,
    fetchNextLocked,
    hasNextLocked,
    isFetchingNextLocked,
  } = useVerrouillageV2();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex">
        <Button
          variant="outline"
          onClick={handleLockAll}
          disabled={readyTickets.length === 0 || isLockingAll}
          className="flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 w-full sm:w-auto"
        >
          <Lock className="h-4 w-4" />
          Tout valider V1 ({readyTickets.length})
        </Button>
      </div>

      <TicketFilterBar value={filters} onChange={setFilters} livreurOptions={livreurOptions} restaurantOptions={restaurantOptions} />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <TicketReadyList
          tickets={filteredReadyTickets}
          onLock={handleLock}
          hasNextPage={!!hasNextReady}
          isFetchingNextPage={isFetchingNextReady}
          fetchNextPage={fetchNextReady}
        />
        <TicketLockedList
          tickets={filteredLockedTickets}
          hasNextPage={!!hasNextLocked}
          isFetchingNextPage={isFetchingNextLocked}
          fetchNextPage={fetchNextLocked}
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <ArrowRight className="h-5 w-5 text-gray-500 shrink-0" />
        <p className="text-sm text-gray-600">
          Une fois validés V1, les tickets sont transmis automatiquement à la{' '}
          <span className="font-semibold text-gray-900">validation finale (V2)</span> du DG.
        </p>
      </div>
    </div>
  );
}
