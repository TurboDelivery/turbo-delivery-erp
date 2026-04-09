'use client';

import { CreneauStatsOverview } from '@/components/creneaux/stats/creneau-stats-overview';
import { CreneauLegende } from '@/components/creneaux/table/creneau-legende';
import { CreneauSemaineHeader } from '@/components/creneaux/table/creneau-semaine-header';
import { CreneauWeeklyTable } from '@/components/creneaux/table/creneau-weekly-table';
import { StatistiquesParJour } from '@/components/creneaux/stats/statistiques-par-jour';
import { CreneauAlerte } from '@/components/creneaux/alerts/creneau-alerte';
import { ICreneauStats, ICreneauTurboy, IStatistiqueJour, ICreneauAlerte, CreneauStatutJour } from '@/features/creneaux/types/creneau.types';

// --- Mock data for initial development ---
const MOCK_STATS: ICreneauStats = {
  capaciteGlobale: 90,
  tauxPresenceGlobal: 90,
  retention: 80,
  fideliteTurboys: 90,
};

const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const DATES_SEMAINE: Record<string, string> = {
  LUNDI: '2026-03-23',
  MARDI: '2026-03-24',
  MERCREDI: '2026-03-25',
  JEUDI: '2026-03-26',
  VENDREDI: '2026-03-27',
  SAMEDI: '2026-03-28',
  DIMANCHE: '2026-03-29',
};

function randomStatut(): CreneauStatutJour {
  const statuts = [CreneauStatutJour.PRESENT, CreneauStatutJour.PRESENT, CreneauStatutJour.PRESENT, CreneauStatutJour.ABSENT, CreneauStatutJour.RETARD];
  return statuts[Math.floor(Math.random() * statuts.length)];
}

const MOCK_TURBOYS: ICreneauTurboy[] = [
  'Adama Diallo', 'Boubacar Traore', 'Cheikh Ndiaye', 'Djibril Sow', 'Elhadj Barry',
  'Fatou Camara', 'Gorgui Mbaye', 'Habib Kone', 'Ibrahim Toure', 'Jean-Paul Koffi',
  'Karim Bah', 'Lamine Cisse',
].map((nom, i) => ({
  id: String(i + 1),
  nomComplet: nom,
  jours: JOURS_SEMAINE.map((jour) => ({
    jour,
    date: DATES_SEMAINE[jour],
    statut: randomStatut(),
  })),
  assiduite: Math.floor(Math.random() * 40) + 60,
}));

const MOCK_STATS_JOUR: IStatistiqueJour[] = JOURS_SEMAINE.map((jour) => ({
  jour,
  date: DATES_SEMAINE[jour],
  pourcentage: Math.floor(Math.random() * 50) + 20,
  presents: Math.floor(Math.random() * 10) + 5,
  total: 15,
}));

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

export function CreneauPageContent() {
  return (
    <div className="space-y-6">
      <CreneauStatsOverview stats={MOCK_STATS} />
      <CreneauLegende />

      <CreneauSemaineHeader debut="2026-03-23" fin="2026-03-29" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <CreneauWeeklyTable data={MOCK_TURBOYS} jourDates={DATES_SEMAINE} />
        <StatistiquesParJour data={MOCK_STATS_JOUR} />
      </div>

      <div className="space-y-3">
        {MOCK_ALERTES.map((alerte, i) => (
          <CreneauAlerte key={i} alerte={alerte} />
        ))}
      </div>
    </div>
  );
}
