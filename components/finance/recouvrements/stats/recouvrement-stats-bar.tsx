"use client";
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { StatCard } from './recouvrement-stat-card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import DateFilterInput from '@/components/finance/date-filter-input';
import useRecouvrementDashboard from '@/features/recouvrements/hooks/use-recouvrement-dashboard';
import { useFactureStats } from '@/features/recouvrements/hooks/use-facture-stats';

export default function RecouvrementStatsBar() {
  const { filters, handleDateChange } = useRecouvrementDashboard();
  const { summary, isLoading } = useFactureStats(filters.debut, filters.fin);

  const montantRestant = (summary?.montantTotalARecouvrir || 0) - (summary?.montantDejaRecouvre || 0);

  return (
    <div className="flex flex-col gap-4">
      <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </>
        ) : (
          <>
            <StatCard
              title="Factures à recouvrir"
              value={summary?.nombreFacturesARecouvrir || 0}
              icon={<FileText className="h-5 w-5" />}
              colorVariant="blue"
              formatValue={(value) => value.toLocaleString()}
            />
            <StatCard
              title="Montant total à recouvrir"
              value={summary?.montantTotalARecouvrir || 0}
              icon={<FileText className="h-5 w-5" />}
              colorVariant="purple"
              formatValue={formatCFA}
            />
            <StatCard
              title="Montant déjà recouvré"
              value={summary?.montantDejaRecouvre || 0}
              icon={<CheckCircle className="h-5 w-5" />}
              colorVariant="green"
              formatValue={formatCFA}
            />
            <StatCard
              title="Reste à recouvrir"
              value={montantRestant}
              icon={<AlertCircle className="h-5 w-5" />}
              colorVariant="amber"
              formatValue={formatCFA}
            />
          </>
        )}
      </div>
    </div>
  );
}
