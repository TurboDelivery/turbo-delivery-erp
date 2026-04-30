'use client';

import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicketReadyList from './TicketReadyList';
import TicketLockedList from './TicketLockedList';
import { fakeReadyTickets, type TicketV2 } from '../data/fake-tickets';

export default function VerrouillageV2Content() {
  const [readyTickets, setReadyTickets] = useState<TicketV2[]>(fakeReadyTickets);
  const [lockedTickets, setLockedTickets] = useState<TicketV2[]>([]);

  const handleLock = (id: string) => {
    const ticket = readyTickets.find((t) => t.id === id);
    if (!ticket) return;
    setReadyTickets((prev) => prev.filter((t) => t.id !== id));
    setLockedTickets((prev) => [...prev, ticket]);
  };

  const handleLockAll = () => {
    setLockedTickets((prev) => [...prev, ...readyTickets]);
    setReadyTickets([]);
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <Button
          variant="outline"
          onClick={handleLockAll}
          disabled={readyTickets.length === 0}
          className="flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2"
        >
          <Lock className="h-4 w-4" />
          Tout verrouiller ({readyTickets.length})
        </Button>
      </div>

      <div className="flex gap-5 items-start">
        <TicketReadyList tickets={readyTickets} onLock={handleLock} />
        <TicketLockedList tickets={lockedTickets} />
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
