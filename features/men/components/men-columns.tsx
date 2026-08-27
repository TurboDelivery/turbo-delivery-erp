import React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Checkbox, Chip } from '@/components/heroui';
import { Mail, MapPin } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { type Restaurant } from '@/types/models';
import { AvatarCell } from './avatar-cell';
import { StatusChip } from './status-chip';
import { TurboyActionMenu } from './turboy-action-menu';

export function getMenColumns(restaurants: Restaurant[]): ColumnDef<ITurboy>[] {
  return [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        isSelected={table.getIsAllPageRowsSelected()}
        isIndeterminate={table.getIsSomePageRowsSelected()}
        onValueChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        aria-label="Tout sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        isSelected={row.getIsSelected()}
        onValueChange={(checked) => row.toggleSelected(checked)}
        aria-label="Sélectionner"
      />
    ),
    enableSorting: false,
    size: 40,
  },
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
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Mail className="w-3 h-3 shrink-0" />
              {t.email ?? '-'}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'commission',
    header: 'COMMISSION',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {row.original.commission != null ? `${row.original.commission}%` : '--'}
      </span>
    ),
  },
  {
    accessorKey: 'typeLivreur',
    header: 'TYPE DE LIVREUR',
    cell: ({ row }) => {
      // V54 (2026-05-29) — Passage par le helper centralisé pour gérer les
      // 3 types (INDEPENDANT, JOURNALIER, SUPERVISEUR_LIVREUR) + fallback
      // "À catégoriser" sur valeur inconnue. Avant : un ternaire à 2
      // branches affichait "Journalier" pour tout ce qui n'était pas
      // INDEPENDANT — ce qui faisait passer un superviseur-livreur pour
      // un journalier dans la liste filtrée.
      const display = getTurboyTypeDisplay(row.original.typeLivreur);
      return (
        <Chip color={display.chipColor} size="sm" variant="flat">
          {display.label}
        </Chip>
      );
    },
  },
  {
    accessorKey: 'habitation',
    header: 'DOMICILIÉ',
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
    id: 'assignation',
    header: 'ASSIGNATION',
    cell: ({ row }) => {
      const type = row.original.type;
      if (type === 'TURBO') {
        return (
          <Chip color="success" size="sm" variant="flat">
            Assigné
          </Chip>
        );
      }
      if (type === 'FREE') {
        return (
          <Chip color="primary" size="sm" variant="flat">
            Bird / Libre
          </Chip>
        );
      }
      if (type === 'WAITING') {
        return (
          <Chip color="warning" size="sm" variant="flat">
            En attente
          </Chip>
        );
      }
      return (
        <Chip color="default" size="sm" variant="flat">
          Non assigné
        </Chip>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'ÉTAT DU COMPTE',
    cell: ({ row }) => <StatusChip status={row.original.status} />,
  },
  {
    id: 'actions',
    header: 'ACTIONS',
      cell: ({ row }) => <TurboyActionMenu turboy={row.original} restaurants={restaurants} />,
    },
  ];
}
