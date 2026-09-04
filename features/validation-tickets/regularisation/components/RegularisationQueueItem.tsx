'use client';

import { Clock } from 'lucide-react';
import { formatMontant } from '@/utils/format.utils';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';

interface Props {
  ticket: BonLivraisonTerminee;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function RegularisationQueueItem({ ticket, isSelected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ticket.commandeId)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary ${
        isSelected ? 'border-l-4 border-indigo-500 bg-surface-secondary' : 'border-l-4 border-transparent'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
        <Clock className="h-4 w-4 text-orange-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{ticket.reference}</p>
        <p className="text-xs text-muted truncate">
          {ticket.livreur} · {ticket.restaurant}
        </p>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <span className="text-sm font-semibold text-foreground">{formatMontant(ticket.coutCommande)}</span>
        <span className="text-xs font-medium text-orange-500">{ticket.heure}</span>
      </div>
    </button>
  );
}
