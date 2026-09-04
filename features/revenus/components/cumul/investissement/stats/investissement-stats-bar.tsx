'use client';

import { CalendarCheck2, CalendarClock, CalendarPlus, TrendingDown } from 'lucide-react';
import InvestissementStatCard from '@/features/revenus/components/cumul/investissement/stats/investissement-stat-card';
import { useInvestissementStatsSummary, useInvestissementStatsFilters } from '@/features/investissement/hooks';
import DateFilterInput from '@/components/finance/date-filter-input';
import EtatErreur from '@/components/commons/EtatErreur';

export default function InvestissementStatsBar() {
  const { data, isLoading, isFetching, isError, refetch } = useInvestissementStatsSummary();
  const { filters, handleDateChange } = useInvestissementStatsFilters();

  const stats = [
    {
      title: 'Total des investissements',
      value: data?.totalInvestissement ?? 0,
      icon: <CalendarClock className="w-6 h-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total remboursé',
      value: data?.totalRembourse ?? 0,
      icon: <CalendarCheck2 className="w-6 h-6" />,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'À rembourser ce mois',
      value: data?.totalARembourserCeMois ?? 0,
      icon: <CalendarPlus className="w-6 h-6" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Montant restant',
      value: data?.montantRestant ?? 0,
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="w-full py-6">
      <div className="mb-4">
        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      </div>
      {/* Chaque carte retombe sur `?? 0` : sur echec, « Montant restant 0 » se lit
          comme une dette soldee. */}
      {isError ? (
        <div className="rounded-xl border border-separator bg-surface">
          <EtatErreur quoi="les montants investis" onReessayer={() => refetch()} enCours={isFetching} />
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <InvestissementStatCard stat={stat} key={index} isLoading={isLoading} />
        ))}
      </div>
      )}
    </div>
  );
}
