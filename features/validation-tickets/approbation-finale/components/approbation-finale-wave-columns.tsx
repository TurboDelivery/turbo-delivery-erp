import { ColumnDef } from '@tanstack/react-table';
import { IGrillePaiementLigne } from '@/features/validation-tickets/grille-de-paiement/types/grille-paiement.type';

export const approbationFinaleWaveColumns: ColumnDef<IGrillePaiementLigne>[] = [
  {
    accessorKey: 'turboy',
    header: 'Turboy',
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-semibold text-gray-800">{row.original.turboy.nom}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{row.original.turboy.code}</p>
      </div>
    ),
  },
  {
    accessorKey: 'numeroWave',
    header: 'N° Wave',
    cell: ({ row }) =>
      row.original.numeroWave ? (
        <span className="text-sm text-gray-600">{row.original.numeroWave}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
  {
    accessorKey: 'netAPayer',
    header: 'Net',
    cell: ({ row }) => (
      <span className="text-sm font-bold text-green-600">
        {row.original.netAPayer.toLocaleString('fr-FR')}
      </span>
    ),
  },
];
