'use client';

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ITurboy } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { Avatar, Button, Chip } from '@/components/heroui';
import { Edit2, Mail, Phone } from 'lucide-react';
import { UpdateTurboyTypeModal } from '@/components/turboys/modals';

// V54 (2026-05-29) — Les anciennes fonctions locales getTypeColor / getTypeLabel
// ne connaissaient pas SUPERVISEUR_LIVREUR (default → 'default' / brut). On
// utilise désormais le helper centralisé features/turboys/utils.

export const getTurboyStatusColor = (status: number | null) => {
  if (status === 1) return 'success';
  if (status === 0) return 'danger';
  return 'warning';
};

export const getTurboyStatusLabel = (status: number | null) => {
  if (status === 1) return 'Actif';
  if (status === 0) return 'Inactif';
  return 'Inconnu';
};

const getStatusColor = getTurboyStatusColor;
const getStatusLabel = getTurboyStatusLabel;

// Exporté pour partage colonne + carte mobile (zéro divergence d'actions).
export function TurboyActionsCell({ turboy }: { turboy: ITurboy }) {
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <>
      <Button isIconOnly className="bg-blue-500 hover:bg-blue-600 text-white" size="sm" title="Modifier le type" onPress={() => setOpenEdit(true)}>
        <Edit2 className="w-4 h-4" />
      </Button>

      <UpdateTurboyTypeModal isOpen={openEdit} onOpenChange={setOpenEdit} turboy={turboy} />
    </>
  );
}

export const turboyTableColumns: ColumnDef<ITurboy>[] = [
  {
    accessorKey: 'prenoms',
    header: 'Nom',
    cell: ({ row }) => {
      const turboy = row.original;
      const email = row.original.email || '-';
      const tel = row.original.telephone || '-';
      return (
        <div className="flex items-center gap-3">
          <Avatar isBordered name={`${turboy.prenoms} ${turboy.nom}`} size="sm" src={turboy.avatarUrl ?? undefined} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {turboy.prenoms} {turboy.nom}
            </span>
            <span className="text-xs text-gray-500 flex gap-1">
              <Phone className="w-4 h-4 text-gray-400" /> {tel}
            </span>
            <span className="text-xs text-gray-500 flex gap-1">
              <Mail className="w-4 h-4 text-gray-400" /> {email}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'gender',
    header: 'Genre',
    cell: ({ row }) => {
      const gender = row.original.gender;
      return <span className="text-sm">{gender || '-'}</span>;
    },
  },
  {
    accessorKey: 'typeLivreur',
    header: 'Type',
    cell: ({ row }) => {
      const display = getTurboyTypeDisplay(row.original.typeLivreur);
      return (
        <Chip color={display.chipColor} size="sm" variant="flat">
          {display.label}
        </Chip>
      );
    },
  },
  {
    accessorKey: 'salaire',
    header: 'Salaire',
    cell: ({ row }) => {
      const salaire = row.original.salaire;
      return <span className="text-sm font-mono">{salaire ? `${salaire.toLocaleString('fr-FR')} FCFA` : '-'}</span>;
    },
  },
  {
    accessorKey: 'commission',
    header: 'Commission',
    cell: ({ row }) => {
      const commission = row.original.commission;
      return (
        <span className="text-sm font-mono">
          {commission !== null && commission !== undefined ? `${commission} %` : '-'}
        </span>
      );
    },
  },
  {
    accessorKey: 'immatriculation',
    header: 'Immatriculation',
    cell: ({ row }) => {
      const immatriculation = row.original.immatriculation;
      return <span className="text-sm font-mono">{immatriculation || '-'}</span>;
    },
  },
  {
    accessorKey: 'matricule',
    header: 'Matricule',
    cell: ({ row }) => {
      const matricule = row.original.matricule;
      return <span className="text-sm font-mono">{matricule || '-'}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Chip color={getStatusColor(status)} size="sm" variant="flat">
          {getStatusLabel(status)}
        </Chip>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <TurboyActionsCell turboy={row.original} />,
  },
];
