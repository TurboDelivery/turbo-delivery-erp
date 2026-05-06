'use client';

import { CreneauTicketStatsVm } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface VerrouillageV2StatsProps {
  stats: CreneauTicketStatsVm | undefined;
  isLoading?: boolean;
}

export function VerrouillageV2Stats({ stats, isLoading }: VerrouillageV2StatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tickets V2 validés</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{stats?.nbV2Valide ?? '—'}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total commandes</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {stats != null ? formatCFA(stats.totalMontantCommandesV2Valide) : '—'}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total commissions</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {stats != null ? formatCFA(stats.totalCommissionsV2Valide) : '—'}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total tickets créneau</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{stats?.nbTotalTickets ?? '—'}</p>
      </div>
    </div>
  );
}
