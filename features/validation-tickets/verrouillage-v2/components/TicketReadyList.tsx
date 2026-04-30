'use client';

import TicketReadyCard from './TicketReadyCard';
import type { TicketV2 } from '../data/fake-tickets';

interface Props {
  tickets: TicketV2[];
  onLock: (id: string) => void;
}

export default function TicketReadyList({ tickets, onLock }: Props) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
          <h2 className="text-base font-semibold text-gray-800">Prêts pour V2</h2>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
          {tickets.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <TicketReadyCard key={ticket.id} ticket={ticket} onLock={onLock} />
        ))}
      </div>
    </div>
  );
}
