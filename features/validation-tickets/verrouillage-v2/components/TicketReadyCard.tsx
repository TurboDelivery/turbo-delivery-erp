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
    <div className="flex flex-col gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
      {/* Référence + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-gray-900 truncate">{ticket.reference}</span>
          <span className="text-xs text-gray-500 truncate">{ticket.restaurant}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Montants */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-gray-400">CMD</span>
        <span className="font-semibold text-gray-700">{formatCFA(ticket.coutCommande)}</span>
        <span className="text-gray-200">·</span>
        <span className="text-gray-400">LIV</span>
        <span className="font-semibold text-gray-700">{formatCFA(ticket.coutLivraison)}</span>
        <span className="text-gray-200">·</span>
        <span className="text-gray-400">COM</span>
        <span className="font-semibold text-green-600">
          {ticket.commission != null ? formatCFA(ticket.commission) : '—'}
        </span>
      </div>
      {ticket.createdByUser && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Créé par</span>
          <span className="font-medium text-gray-600">
            {ticket.createdByUser.prenoms} {ticket.createdByUser.nom}
          </span>
        </div>
      )}
    </div>
  );
}
