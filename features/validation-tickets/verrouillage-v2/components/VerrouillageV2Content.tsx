'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicketReadyList from './TicketReadyList';
import TicketLockedList from './TicketLockedList';
import useVerrouillageV2 from '../hooks/use-verrouillage-v2';

export default function VerrouillageV2Content() {
  const { readyTickets, isLocking, isLockingAll, handleLock, handleLockAll } = useVerrouillageV2();

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <Button
          variant="outline"
          onClick={handleLockAll}
          disabled={readyTickets.length === 0 || isLockingAll}
          className="flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2"
        >
          <Lock className="h-4 w-4" />
          Tout verrouiller ({readyTickets.length})
        </Button>
      </div>

      <div className="flex gap-5 items-start">
        <TicketReadyList tickets={readyTickets} onLock={handleLock} />
        {/* TODO: alimenter la liste des verrouillés depuis l'endpoint quand disponible */}
        <TicketLockedList tickets={[]} />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <ArrowRight className="h-5 w-5 text-gray-500 shrink-0" />
        <p className="text-sm text-gray-600">
          Une fois verrouillés, les tickets V2 sont transmis automatiquement à la{' '}
          <span className="font-semibold text-gray-900">Grille de paiement</span> du Pôle 2 (Comptabilité).
        </p>
      </div>
    </div>
  );
}
