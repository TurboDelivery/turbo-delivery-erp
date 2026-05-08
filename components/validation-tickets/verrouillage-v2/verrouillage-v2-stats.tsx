'use client';

import { CreneauTicketStatsVm } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCfa } from '@/utils/format.utils';

interface VerrouillageV2StatsProps {
  stats: CreneauTicketStatsVm | undefined;
  isLoading?: boolean;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase text-gray-400 leading-tight">{label}</p>
      <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900 break-words">{value}</p>
    </div>
  );
}

export function VerrouillageV2Stats({ stats, isLoading }: VerrouillageV2StatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Tickets V2 validés" value={stats?.nbV2Valide ?? '—'} />
      <StatCard
        label="Total commandes"
        value={stats != null ? formatCfa(stats.totalMontantCommandesV2Valide) : '—'}
      />
      <StatCard
        label="Total commissions"
        value={stats != null ? formatCfa(stats.totalCommissionsV2Valide) : '—'}
      />
      <StatCard label="Total tickets créneau" value={stats?.nbTotalTickets ?? '—'} />
    </div>
  );
}
