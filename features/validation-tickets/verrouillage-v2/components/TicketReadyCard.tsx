'use client';

import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketControleV2 } from '../types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface Props {
  ticket: TicketControleV2;
  onLock: (ticketId: string) => void;
}

export default function TicketReadyCard({ ticket, onLock }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* Référence + montant */}
      <div className="flex items-center justify-between gap-3 sm:flex-1 sm:min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-gray-900 truncate">{ticket.reference}</span>
          <span className="text-xs text-gray-500 truncate">{ticket.restaurant}</span>
        </div>
        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{formatCFA(ticket.coutLivraison)}</span>
      </div>

      {/* Badge + action */}
      <div className="flex items-center justify-end gap-3">
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border-0 text-xs font-medium px-3 py-1 rounded-full">
          Authentifié
        </Badge>
        <Button
          size="sm"
          onClick={() => onLock(ticket.commandeId)}
          className="bg-gray-900 hover:bg-gray-700 text-white rounded-full px-4 py-1 text-xs font-semibold flex items-center gap-1.5"
        >
          <Lock className="h-3 w-3" />
          V1
        </Button>
      </div>
    </div>
  );
}
