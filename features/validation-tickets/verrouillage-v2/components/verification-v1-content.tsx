'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { Button, Spinner } from '@heroui-v3/react';
import TicketReadyList from './TicketReadyList';
import TicketLockedList from './TicketLockedList';
import useVerrouillageV2 from '../hooks/use-verrouillage-v2';
import TicketFilterBar from '@/components/validation-tickets/TicketFilterBar';
import { RejectMotifDialog } from '@/components/validation-tickets/verrouillage-v2/reject-motif-dialog';

export default function VerificationV1Content() {
  const {
    readyTickets,
    lockedTickets,
    totalReady,
    totalLocked,
    filters,
    setFilters,
    livreurOptions,
    isLockingAll,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    handleReject,
    handleLock,
    handleLockAll,
    fetchNextReady,
    hasNextReady,
    isFetchingNextReady,
    fetchNextLocked,
    hasNextLocked,
    isFetchingNextLocked,
    isErrorReady,
    isErrorLocked,
    refetchReady,
    refetchLocked,
  } = useVerrouillageV2();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex">
        {/*
         * La validation en masse envoie une requete PAR ticket : sur une file chargee,
         * l'attente dure plusieurs secondes. Elle n'etait signalee que par un bouton
         * eteint, ce qui se lit comme « rien a valider » et non comme « en cours ».
         * `isPending` porte l'attente ET bloque le second clic, comme `disabled` avant.
         * Le rien-a-valider garde son propre etat, sinon les deux causes se confondent.
         */}
        <Button
          variant="outline"
          onPress={handleLockAll}
          isDisabled={readyTickets.length === 0}
          isPending={isLockingAll}
          className="w-full sm:w-auto"
        >
          {({ isPending }: { isPending: boolean }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <Lock aria-hidden="true" className="size-4" />
              )}
              Tout valider V1 ({totalReady})
            </>
          )}
        </Button>
      </div>

      <TicketFilterBar value={filters} onChange={setFilters} livreurOptions={livreurOptions} />

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <TicketReadyList
          isError={isErrorReady}
          onReessayer={refetchReady}
          tickets={readyTickets}
          total={totalReady}
          onLock={handleLock}
          onReject={setRejectDialogId}
          hasNextPage={!!hasNextReady}
          isFetchingNextPage={isFetchingNextReady}
          fetchNextPage={fetchNextReady}
        />
        <TicketLockedList
          isError={isErrorLocked}
          onReessayer={refetchLocked}
          tickets={lockedTickets}
          total={totalLocked}
          hasNextPage={!!hasNextLocked}
          isFetchingNextPage={isFetchingNextLocked}
          fetchNextPage={fetchNextLocked}
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-separator bg-surface px-5 py-4">
        <ArrowRight aria-hidden="true" className="h-5 w-5 text-muted shrink-0" />
        <p className="text-sm text-muted">
          Une fois validés V1, les tickets sont transmis automatiquement à la{' '}
          <span className="font-semibold text-foreground">validation finale (V2)</span> du DG.
        </p>
      </div>

      <RejectMotifDialog
        open={rejectDialogId !== null}
        ticketId={rejectDialogId}
        isRejecting={isRejecting}
        onConfirm={handleReject}
        onClose={() => setRejectDialogId(null)}
      />
    </div>
  );
}
