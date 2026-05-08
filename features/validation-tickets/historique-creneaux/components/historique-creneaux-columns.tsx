import Link from 'next/link';
import { AlertTriangle, CheckSquare, XCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { IHistoriqueCreneau, StatutCreneau } from '../types/historique-creneaux.type';
import { formatCfa } from '@/utils/format.utils';

const STATUT_CONFIG: Record<
  StatutCreneau,
  { label: string; className: string; icon?: React.ReactNode }
> = {
  paye: {
    label: 'Payé',
    className: 'bg-green-100 text-green-700',
    icon: <CheckSquare className="h-3.5 w-3.5" />,
  },
  regularisation: {
    label: 'En régularisation',
    className: 'bg-amber-100 text-amber-700',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  rejete: {
    label: 'Rejeté',
    className: 'bg-red-100 text-red-600',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  soumis: {
    label: 'Soumis',
    className: 'bg-blue-100 text-blue-700',
  },
  valide_v1: {
    label: 'Validé V1',
    className: 'bg-indigo-100 text-indigo-700',
  },
  verrouille_v2: {
    label: 'Verrouillé V2',
    className: 'bg-purple-100 text-purple-700',
  },
};

export const historiqueCreneauxColumns: ColumnDef<IHistoriqueCreneau>[] = [
  {
    accessorKey: 'code',
    header: 'Créneau',
    cell: ({ row }) => (
      <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{row.original.code}</span>
    ),
  },
  {
    id: 'periode',
    header: 'Période',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {row.original.periodeDebut} → {row.original.periodeFin}
      </span>
    ),
  },
  {
    accessorKey: 'livreurs',
    header: 'Livreurs',
    cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.livreurs}</span>,
  },
  {
    accessorKey: 'tickets',
    header: 'Tickets',
    cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.tickets}</span>,
  },
  {
    accessorKey: 'netFcfa',
    header: 'Net (FCFA)',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
        {formatCfa(row.original.netFcfa)}
      </span>
    ),
  },
  {
    id: 'soumisLe',
    header: 'Soumis le',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-700 whitespace-nowrap">{row.original.soumisLe}</span>
        <span className="text-xs text-gray-400">par {row.original.soumisParNom}</span>
      </div>
    ),
  },
  {
    id: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const config = STATUT_CONFIG[row.original.statut];
      return (
        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold w-fit ${config.className}`}
          >
            {config.icon}
            {config.label}
          </span>
          {row.original.commentaire && (
            <p className="text-xs text-gray-500 max-w-[220px] line-clamp-2">{row.original.commentaire}</p>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link
        href={`/validation-tickets/historique-creneaux/${row.original.id}`}
        className="text-sm font-medium text-red-500 hover:text-red-600 whitespace-nowrap"
      >
        Détail &rsaquo;
      </Link>
    ),
  },
];
