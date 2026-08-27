'use client';

import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import EtatErreur from '@/components/commons/EtatErreur';
import RegularisationQueueItem from './RegularisationQueueItem';

interface Props {
  tickets: BonLivraisonTerminee[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isError?: boolean;
  isFetching?: boolean;
  onReessayer?: () => void;
}

export default function RegularisationQueue({
  tickets,
  selectedId,
  onSelect,
  isError = false,
  isFetching = false,
  onReessayer,
}: Props) {
  return (
    <div className="w-full lg:w-[340px] lg:shrink-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 text-orange-400">⏱</span>
          <span className="text-sm font-semibold text-gray-800">File d&apos;attente</span>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
          {tickets.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {tickets.map((ticket) => (
          <RegularisationQueueItem
            key={ticket.commandeId}
            ticket={ticket}
            isSelected={selectedId === ticket.commandeId}
            onSelect={onSelect}
          />
        ))}

        {/* Un echec de chargement ne doit pas se lire comme « aucun ticket en attente » :
            la file paraissait traitee alors que rien n'avait pu etre lu. */}
        {isError && (
          <EtatErreur
            quoi="les tickets à régulariser"
            onReessayer={onReessayer}
            enCours={isFetching}
          />
        )}
        {!isError && tickets.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">Aucun ticket en attente</p>
        )}
      </div>
    </div>
  );
}
