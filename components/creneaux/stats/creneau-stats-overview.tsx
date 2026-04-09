'use client';

import { CreneauStatCard } from './creneau-stat-card';
import { ICreneauStats } from '@/features/creneaux/types/creneau.types';

interface CreneauStatsOverviewProps {
  stats: ICreneauStats;
}

export function CreneauStatsOverview({ stats }: CreneauStatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CreneauStatCard label="Capacite globale" value={stats.capaciteGlobale} color="success" />
      <CreneauStatCard label="Taux de Presence Global" sublabel="vs la semaine derniere" value={stats.tauxPresenceGlobal} color="success" />
      <CreneauStatCard label="Retention" sublabel="creneau utilises" value={stats.retention} color="primary" />
      <CreneauStatCard label="Fidelite Turboys" sublabel="creneau definis" value={stats.fideliteTurboys} color="primary" />
    </div>
  );
}
