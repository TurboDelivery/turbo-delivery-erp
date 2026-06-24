import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IPointageRow, ISignalementPointage } from '@/features/turboys/types/pointage.types';

// Doit refléter pointage_config.rayon (déployé à 500 m). TODO : lire depuis
// GET /api/erp/pointage-config si le rayon devient ajustable par site.
export const RAYON_M = 500;

const STATUT_DOT: Record<string, string> = {
  ON_TIME: 'bg-green-500',
  LATE: 'bg-amber-500',
  MISSED: 'bg-red-500',
};

function heureDe(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'HH:mm', { locale: fr });
  } catch {
    return '—';
  }
}

/** Cellule d'un signalement : pastille statut + heure pointée + distance (rouge si hors-zone). */
function SignalementCell({ s }: { s: ISignalementPointage | null }) {
  if (!s || !s.pointeAt) return <span className="text-gray-300 text-xs">—</span>;
  const horsZone = s.distanceMetres != null && s.distanceMetres > RAYON_M;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUT_DOT[s.statut ?? ''] ?? 'bg-gray-300'}`} />
      <span className="font-medium text-gray-800">{heureDe(s.pointeAt)}</span>
      {s.distanceMetres != null && (
        <span className={horsZone ? 'font-semibold text-red-600' : 'text-gray-400'}>
          {Math.round(s.distanceMetres)} m
        </span>
      )}
    </div>
  );
}

const STATUT_JOUR_CLS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  RETARD: 'bg-amber-100 text-amber-700',
  ABSENT: 'bg-red-100 text-red-700',
  JUSTIFIE: 'bg-blue-100 text-blue-700',
  NON_INSCRIT: 'bg-gray-100 text-gray-500',
};

/** Au moins un signalement du jour hors du rayon. */
export function jourHorsZone(r: IPointageRow): boolean {
  return [r.startSignalement, r.midSignalement, r.mid2Signalement, r.endSignalement].some(
    (s) => s?.distanceMetres != null && s.distanceMetres > RAYON_M,
  );
}

export const pointageColumns: ColumnDef<IPointageRow>[] = [
  {
    accessorKey: 'date',
    header: 'Jour',
    cell: ({ row }) => {
      let label = row.original.date;
      try {
        label = format(parseISO(row.original.date), 'EEE dd MMM', { locale: fr });
      } catch {
        /* garde la valeur brute */
      }
      return <span className="whitespace-nowrap text-xs font-medium capitalize">{label}</span>;
    },
  },
  { id: 'montee', header: 'Montée', cell: ({ row }) => <SignalementCell s={row.original.startSignalement} /> },
  { id: 'relance1', header: 'Relance 1', cell: ({ row }) => <SignalementCell s={row.original.midSignalement} /> },
  { id: 'relance2', header: 'Relance 2', cell: ({ row }) => <SignalementCell s={row.original.mid2Signalement} /> },
  { id: 'fin', header: 'Fin', cell: ({ row }) => <SignalementCell s={row.original.endSignalement} /> },
  {
    id: 'horsZone',
    header: 'Hors-zone',
    cell: ({ row }) => {
      if (!jourHorsZone(row.original)) return <span className="text-xs text-gray-300">—</span>;
      const justifie = row.original.absenceJustifiee === true;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            justifie ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {justifie ? 'Justifié' : 'Hors-zone'}
        </span>
      );
    },
  },
  {
    accessorKey: 'statutJour',
    header: 'Statut',
    cell: ({ row }) => {
      const s = row.original.statutJour ?? 'NON_INSCRIT';
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            STATUT_JOUR_CLS[s] ?? 'bg-gray-100 text-gray-500'
          }`}
        >
          {s.toLowerCase().replace(/_/g, ' ')}
        </span>
      );
    },
  },
];
