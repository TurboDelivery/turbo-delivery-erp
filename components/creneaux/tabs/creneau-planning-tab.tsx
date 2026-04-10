'use client';

import { useCallback, useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { CreneauStatsOverview } from '@/components/creneaux/stats/creneau-stats-overview';
import { CreneauLegende } from '@/components/creneaux/table/creneau-legende';
import { CreneauSemaineHeader } from '@/components/creneaux/table/creneau-semaine-header';
import { CreneauWeeklyTable } from '@/components/creneaux/table/creneau-weekly-table';
import { StatistiquesParJour } from '@/components/creneaux/stats/statistiques-par-jour';
import { CreneauAlerte } from '@/components/creneaux/alerts/creneau-alerte';
import { creneauFiltersClient } from '@/features/creneaux/filters/creneau.filter';
import { getSundayFromMonday, getWeekDates } from '@/features/creneaux/utils/semaine.utils';
import { useCreneauDashboardQuery } from '@/features/creneaux/queries/creneau.query';
import PaginationBlock from '@/components/pagination-block';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreneauPlanningTab() {
  const [filters, setFilters] = useQueryStates(
    creneauFiltersClient.filter,
    creneauFiltersClient.option,
  );
const { data } = useCreneauDashboardQuery({
  page: filters.page,
  size: 10,
  debut: filters.semaine ?? undefined,
});
console.log('Données de la semaine:', data);
const stat=data?.stats;
console.log('Stats de la semaine:', stat);
  const selectedSemaine = filters.semaine;
  const fin = useMemo(() => getSundayFromMonday(selectedSemaine), [selectedSemaine]);
  const weekDates = useMemo(() => getWeekDates(selectedSemaine), [selectedSemaine]);

  const turboys = data?.turboys?.data ?? [];
  const statsJour = data?.statsJour ?? [];
  const pageCount = data?.turboys?.pageCount ?? 0;

  const handleSemaineChange = useCallback(
    (semaine: string) => {
      setFilters({ semaine, page: 0 });
    },
    [setFilters],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters({ page });
    },
    [setFilters],
  );

  const pagination = useMemo(
    () => ({
      page: data?.turboys?.page ?? filters.page,
      pageCount,
      onPageChange: handlePageChange,
    }),
    [data?.turboys?.page, pageCount, filters.page, handlePageChange],
  );

  return (
    <div className="space-y-6">
      <CreneauStatsOverview stats={stat} />
      <CreneauLegende />

      <CreneauSemaineHeader
        selectedSemaine={selectedSemaine}
        fin={fin}
        onSemaineChange={handleSemaineChange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <CreneauWeeklyTable
          data={turboys}
          jourDates={weekDates}
          pagination={pagination}
        />
        <StatistiquesParJour data={statsJour} />
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center">
          <PaginationBlock
            currentPage={pagination.page}
            totalPages={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <div className="space-y-3">
        {(data?.alertes ?? []).map((alerteItem, i) => (
          <CreneauAlerte key={i} alerte={alerteItem} />
        ))}
      </div>
    </div>
  );
}
