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
import { ICreneauStats, ICreneauTurboy, IStatistiqueJour, ICreneauAlerte, CreneauStatutJour } from '@/features/creneaux/types/creneau.types';

// --- Mock data ---
const MOCK_STATS: ICreneauStats = {
  capaciteGlobale: 90,
  tauxPresenceGlobal: 90,
  retention: 80,
  fideliteTurboys: 90,
};

const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

function randomStatut(): CreneauStatutJour {
  const statuts = [CreneauStatutJour.PRESENT, CreneauStatutJour.PRESENT, CreneauStatutJour.PRESENT, CreneauStatutJour.ABSENT, CreneauStatutJour.RETARD];
  return statuts[Math.floor(Math.random() * statuts.length)];
}

function generateMockTurboys(weekDates: Record<string, string>): ICreneauTurboy[] {
  return [
    'Adama Diallo', 'Boubacar Traore', 'Cheikh Ndiaye', 'Djibril Sow', 'Elhadj Barry',
    'Fatou Camara', 'Gorgui Mbaye', 'Habib Kone', 'Ibrahim Toure', 'Jean-Paul Koffi',
    'Karim Bah', 'Lamine Cisse',
  ].map((nom, i) => ({
    id: String(i + 1),
    nomComplet: nom,
    jours: JOURS_SEMAINE.map((jour) => ({
      jour,
      date: weekDates[jour],
      statut: randomStatut(),
    })),
    assiduite: Math.floor(Math.random() * 40) + 60,
  }));
}

function generateMockStatsJour(weekDates: Record<string, string>): IStatistiqueJour[] {
  return JOURS_SEMAINE.map((jour) => ({
    jour,
    date: weekDates[jour],
    pourcentage: Math.floor(Math.random() * 50) + 20,
    presents: Math.floor(Math.random() * 10) + 5,
    total: 15,
  }));
}

const MOCK_ALERTES: ICreneauAlerte[] = [
  {
    type: 'rupture_reseau',
    message: 'Le taux de presence est tombe en dessous de 80% pour certains jours. Veuillez contacter les Turboys absents et verifier la disponibilite.',
    joursImpactes: ['Jeudi 26 (39%)', 'Mercredi 25 (46%)'],
  },
  {
    type: 'predictive',
    message: "Certains jours futurs ont un taux d'inscription trop bas. Veuillez recruter ou mobiliser plus de Turboys pour ces creneaux.",
    joursImpactes: ['Lundi 30 (Prevu 41%)', 'Samedi 28 (Prevu 52%)'],
  },
];

// Mock pagination
const MOCK_PAGE_COUNT = 3;

export function CreneauPageContent() {
  const [filters, setFilters] = useQueryStates(creneauFiltersClient.filter, creneauFiltersClient.option);

  const selectedSemaine = filters.semaine;
  const fin = getSundayFromMonday(selectedSemaine);
  const weekDates = useMemo(() => getWeekDates(selectedSemaine), [selectedSemaine]);

  const mockTurboys = useMemo(() => generateMockTurboys(weekDates), [weekDates]);
  const mockStatsJour = useMemo(() => generateMockStatsJour(weekDates), [weekDates]);

  const handleSemaineChange = useCallback(
    (semaine: string) => {
      setFilters({ semaine, page: 0 });
    },
    [setFilters],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      // HeroUI Pagination is 1-based
      setFilters({ page: page - 1 });
    },
    [setFilters],
  );

  return (
    <div className="space-y-6">
      <CreneauStatsOverview stats={MOCK_STATS} />
      <CreneauLegende />

      <CreneauSemaineHeader
        selectedSemaine={selectedSemaine}
        fin={fin}
        onSemaineChange={handleSemaineChange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <CreneauWeeklyTable
          data={mockTurboys}
          jourDates={weekDates}
          pagination={{
            page: Math.max(0, filters.page ?? 0),
            pageCount: MOCK_PAGE_COUNT,
            onPageChange: handlePageChange,
          }}
        />
        <StatistiquesParJour data={mockStatsJour} />
      </div>

      <div className="space-y-3">
        {MOCK_ALERTES.map((alerte, i) => (
          <CreneauAlerte key={i} alerte={alerte} />
        ))}
      </div>
    </div>
  );
}
