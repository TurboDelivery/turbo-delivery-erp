'use client';

import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface VerrouillageV2StatsProps {
  tickets: BonLivraisonTerminee[];
  ticketsPending: number;
}

export function VerrouillageV2Stats({ tickets, ticketsPending }: VerrouillageV2StatsProps) {
  const totalBrut = tickets.reduce((sum, t) => sum + (t.coutCommande ?? 0), 0);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tickets validés</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{tickets.length}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total brut</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCFA(totalBrut)}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Anomalies résolues</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">—</p>
      </div>
      <div className="rounded-xl border border-yellow-300 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Statut créneau en attente</p>
        <p className="mt-1 text-2xl font-semibold text-yellow-600">{ticketsPending}</p>
      </div>
    </div>
  );
}
