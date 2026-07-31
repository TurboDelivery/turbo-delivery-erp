'use client';

import { Skeleton } from '@heroui/react';

import { ISupervisionStats } from '../types';

interface KpiProps {
  libelle: string;
  valeur: number | undefined;
  note: string;
  couleur: string;
  isLoading: boolean;
}

function Kpi({ libelle, valeur, note, couleur, isLoading }: KpiProps) {
  return (
    <div className="rounded-xl border bg-white p-4 dark:bg-black">
      <p className="text-[11px] font-medium uppercase tracking-wide text-default-500">{libelle}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-14 rounded-md" />
      ) : (
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${couleur}`}>{valeur ?? 0}</p>
      )}
      <p className="mt-0.5 text-[11px] text-default-400">{note}</p>
    </div>
  );
}

/**
 * Les quatre compteurs de tête d'écran (`GET /api/erp/supervision/stats`).
 * Ordre et libellés repris de la spec — ce sont les chiffres que la Direction
 * lit en premier.
 */
export function SupervisionKpis({ stats, isLoading }: { stats?: ISupervisionStats; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        libelle="En ligne"
        valeur={stats?.enLigne}
        note="sessions actives à cet instant"
        couleur="text-success"
        isLoading={isLoading}
      />
      <Kpi
        libelle="Actions tracées (24 h)"
        valeur={stats?.actions24h}
        note="tous modules confondus"
        couleur="text-primary"
        isLoading={isLoading}
      />
      <Kpi
        libelle="Jamais connectés"
        valeur={stats?.jamaisConnectes}
        note="indicateur d'adoption — à former"
        couleur="text-warning"
        isLoading={isLoading}
      />
      <Kpi
        libelle="Échecs de connexion (24 h)"
        valeur={stats?.echecs24h}
        note="signal de sécurité"
        couleur="text-danger"
        isLoading={isLoading}
      />
    </div>
  );
}
