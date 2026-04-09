'use client';

import { CreneauStatCard } from './creneau-stat-card';
import { ICreneauStats } from '@/features/creneaux/types/creneau.types';

interface CreneauStatsOverviewProps {
  stats: ICreneauStats;
}

export function CreneauStatsOverview({ stats }: CreneauStatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <CreneauStatCard label="Taux de Presence Global" sublabel="+2% vs semaine derniere" value={stats.tauxPresenceGlobal} color="success" />
      <CreneauStatCard label="Prevision" sublabel="Creneaux remplis" value={stats.retention} color="success" />
      <CreneauStatCard label="Fiabilite Terrain" sublabel="Presences reelles" value={stats.fideliteTurboys} color="primary" />
    </div>
  );
}
