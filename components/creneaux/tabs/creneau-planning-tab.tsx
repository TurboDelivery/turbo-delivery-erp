'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { Search, X } from 'lucide-react';
import { CreneauStatsOverview } from '@/components/creneaux/stats/creneau-stats-overview';
import { CreneauLegende } from '@/components/creneaux/table/creneau-legende';
import { CreneauSemaineHeader } from '@/components/creneaux/table/creneau-semaine-header';
import { CreneauWeeklyTable } from '@/components/creneaux/table/creneau-weekly-table';
import { StatistiquesParJour } from '@/components/creneaux/stats/statistiques-par-jour';
import { CreneauAlerte } from '@/components/creneaux/alerts/creneau-alerte';
import { creneauFiltersClient } from '@/features/creneaux/filters/creneau.filter';
import { getSundayFromMonday, getWeekDates } from '@/features/creneaux/utils/semaine.utils';
import { useCreneauDashboardQuery, useCreneauDashboardRealiteQuery } from '@/features/creneaux/queries/creneau.query';
import PaginationBlock from '@/components/pagination-block';
import { AbsenceActionDialog, AbsenceActionTarget } from '@/components/creneaux/table/absence-action-dialog';
import { ICreneauTurboy, ICreneauJour } from '@/features/creneaux/types/creneau.types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

export function CreneauPlanningTab() {
  const [isRealite, setIsRealite] = useState(false);
  const [absenceTarget, setAbsenceTarget] = useState<AbsenceActionTarget | null>(null);

  const [filters, setFilters] = useQueryStates(
    creneauFiltersClient.filter,
    creneauFiltersClient.option,
  );

  const queryParams = {
    page: filters.page,
    size: PAGE_SIZE,
    debut: filters.semaine ?? undefined,
    search: filters.search || undefined,
  };

  const previsionnel = useCreneauDashboardQuery(!isRealite ? queryParams : undefined);
  const realite = useCreneauDashboardRealiteQuery(isRealite ? queryParams : undefined);
  // On suit la query REELLEMENT affichee : le bascule previsionnel / realite
  // change la source, donc aussi l echec a signaler et la relance a proposer.
  const { data, isError, isFetching, refetch } = isRealite ? realite : previsionnel;
  const stat = data?.stats;

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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ search: e.target.value, page: 0 });
    },
    [setFilters],
  );

  const handleAbsenceClick = useCallback((turboy: ICreneauTurboy, jour: ICreneauJour) => {
    setAbsenceTarget({
      emploiId: turboy.emploiId,
      turoyNomComplet: turboy.nomComplet,
      date: jour.date,
      jourLabel: jour.jour.charAt(0) + jour.jour.slice(1).toLowerCase(),
    });
  }, []);

  const handleSearchClear = useCallback(() => {
    setFilters({ search: '', page: 0 });
  }, [setFilters]);

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
      <div className="flex flex-wrap items-center gap-4">
        <CreneauLegende />
        <button
          onClick={() => setIsRealite((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors ${
            isRealite
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          <span className={`inline-block size-2 rounded-full ${isRealite ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
          {isRealite ? 'Réalité' : 'Prévisionnel'}
        </button>
      </div>

      {/* Barre de contrôle : recherche | sélecteur semaine + pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Recherche */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Rechercher un turboy..."
            className="h-10 w-full rounded-xl border border-border bg-background/60 pl-9 pr-9 text-sm shadow-xs backdrop-blur-xs transition-colors placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          {filters.search && (
            <button
              onClick={handleSearchClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sélecteur semaine + pagination groupés */}
        <div className="flex flex-wrap items-center gap-4">
          <CreneauSemaineHeader
            selectedSemaine={selectedSemaine}
            fin={fin}
            onSemaineChange={handleSemaineChange}
          />
          {pageCount > 1 && (
            <PaginationBlock
              currentPage={pagination.page}
              totalPages={pageCount}
              onPageChange={handlePageChange}
              totalItems={data?.turboys?.total}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <CreneauWeeklyTable
          data={turboys}
          jourDates={weekDates}
          isError={isError}
          onReessayer={() => void refetch()}
          isFetching={isFetching}
          pagination={pagination}
          onAbsenceClick={isRealite ? handleAbsenceClick : undefined}
        />
        <StatistiquesParJour data={statsJour} />
      </div>

      <div className="space-y-3">
        {(data?.alertes ?? []).map((alerteItem, i) => (
          <CreneauAlerte key={i} alerte={alerteItem} />
        ))}
      </div>

      <AbsenceActionDialog
        target={absenceTarget}
        onClose={() => setAbsenceTarget(null)}
      />
    </div>
  );
}
