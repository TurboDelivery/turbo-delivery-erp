'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { Eye, Pencil } from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';

// ── Avatar coloré basé sur la première lettre ───────────────────────────────
const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-green-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-purple-500', 'bg-pink-500',
];
function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Statut ───────────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: number }) {
  if (status === 3) return <Chip color="success" size="sm" variant="flat">Validé</Chip>;
  if (status === 2) return <Chip color="warning" size="sm" variant="flat">En attente</Chip>;
  if (status === 1) return <Chip color="secondary" size="sm" variant="flat">Validé Auth</Chip>;
  return <Chip color="default" size="sm" variant="flat">Inactif</Chip>;
}

// ── Cycle de paiement ────────────────────────────────────────────────────────
const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

export const restaurantColumns: ColumnDef<IRestaurant>[] = [
  {
    id: 'nomEtablissement',
    accessorKey: 'nomEtablissement',
    header: 'NAME',
    cell: ({ row }) => {
      const r = row.original;
      const letter = r.nomEtablissement?.[0]?.toUpperCase() ?? '?';
      const color = getAvatarColor(r.nomEtablissement ?? '');
      return (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {letter}
          </div>
          <span className="font-medium text-sm text-gray-800 capitalize">{r.nomEtablissement}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'EMAIL',
    cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.email || '-'}</span>,
    enableSorting: true,
  },
  {
    id: 'telephone',
    accessorKey: 'telephone',
    header: 'TÉLÉPHONE',
    cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.telephone || '-'}</span>,
    enableSorting: true,
  },
  {
    id: 'localisation',
    accessorKey: 'localisation',
    header: 'LOCALISATION',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">{row.original.localisation || row.original.commune || '-'}</span>
    ),
    enableSorting: true,
  },
  {
    id: 'methodRecouvrement',
    accessorKey: 'methodRecouvrement',
    header: 'CYCLE DE PAIEMENT',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {RECOUVREMENT_LABELS[row.original.methodRecouvrement] ?? row.original.methodRecouvrement ?? '-'}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'STATUS',
    cell: ({ row }) => <StatusChip status={row.original.status} />,
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'ACTION',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="light" isIconOnly as={Link} href={`/restaurants/${row.original.id}`} title="Voir">
          <Eye className="w-4 h-4 text-gray-400" />
        </Button>
        <Button size="sm" variant="light" isIconOnly as={Link} href={`/restaurants/${row.original.id}/edit`} title="Modifier">
          <Pencil className="w-4 h-4 text-gray-400" />
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];

