import React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Chip } from '@heroui/react';
import { MapPin } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { AvatarCell } from './avatar-cell';
import { StatusChip } from './status-chip';
import { TurboyActionMenu } from './turboy-action-menu';

export const menColumns: ColumnDef<ITurboy>[] = [
  {
    accessorKey: 'prenoms',
    header: 'COURSIERS',
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <AvatarCell turboy={t} />
          <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-800">{t.prenoms} {t.nom}</span>
            <span className="text-xs text-gray-400">{t.email ?? '-'}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'salaire',
    header: 'SALAIRE',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {row.original.salaire ? `${row.original.salaire.toLocaleString('fr-FR')} FCFA` : '--'}
      </span>
    ),
  },
  {
    accessorKey: 'typeLivreur',
    header: 'TYPE DE LIVREUR',
    cell: ({ row }) => {
      const type = row.original.typeLivreur;
      return (
        <Chip color={type === 'INDEPENDANT' ? 'warning' : 'secondary'} size="sm" variant="flat">
          {type === 'INDEPENDANT' ? 'Indépendant' : 'Journalier'}
        </Chip>
      );
    },
  },
  {
    accessorKey: 'habitation',
    header: 'LOCALISATION',
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>{row.original.habitation ?? '-'}</span>
      </div>
    ),
  },
  {
    id: 'proprietaire',
    header: 'PROPRIÉTAIRE',
    cell: () => <span className="text-sm text-gray-500">Peut être utilisé partout</span>,
  },
  {
    accessorKey: 'status',
    header: 'ETAT DU COMPTE',
    cell: ({ row }) => <StatusChip status={row.original.status} />,
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => <TurboyActionMenu turboy={row.original} />,
  },
];
