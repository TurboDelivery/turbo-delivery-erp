'use client';

import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TicketV2 } from '../data/fake-tickets';

interface Props {
  ticket: TicketV2;
  onLock: (id: string) => void;
}

export default function TicketReadyCard({ ticket, onLock }: Props) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-100 px-4 py-3 gap-4">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-gray-900">{ticket.ref}</span>
        <span className="text-xs text-gray-500 truncate max-w-[160px]">{ticket.restaurant}</span>
      </div>

      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{ticket.amount}</span>

      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 text-xs font-medium px-3 py-1 rounded-full">
        {ticket.status}
      </Badge>

      <Button
        size="sm"
        onClick={() => onLock(ticket.id)}
        className="bg-gray-900 hover:bg-gray-700 text-white rounded-full px-4 py-1 text-xs font-semibold flex items-center gap-1.5"
      >
        <Lock className="h-3 w-3" />
        V2
      </Button>
    </div>
  );
}
