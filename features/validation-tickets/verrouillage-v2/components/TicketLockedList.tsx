'use client';

import { Lock } from 'lucide-react';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface Props {
  tickets: BonLivraisonTerminee[];
}

export default function TicketLockedList({ tickets }: Props) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-900 inline-block" />
          <h2 className="text-base font-semibold text-gray-800">Validés V1</h2>
        </div>
        <span className="text-sm text-gray-400 font-medium">{tickets.length}</span>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <p className="text-sm text-gray-400">Aucun ticket validé V1 pour cette période.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.commandeId}
              className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-gray-900">{ticket.reference}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">{ticket.restaurant}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCFA(ticket.coutLivraison)}</span>
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
