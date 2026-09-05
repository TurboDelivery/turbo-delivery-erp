'use client';

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ITurboy } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { Avatar, Button, Chip } from '@heroui-v3/react';
import { Edit2, Mail, Phone } from 'lucide-react';
import { UpdateTurboyTypeModal } from '@/components/turboys/modals';
import { formatMontant } from '@/utils/format.utils';
import { getInitials } from '@/utils/createUrlFile';

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
      {/*
       * Le bouton etait peint en `bg-blue-500` avec son survol et son texte blanc ecrits a
       * la main : un bleu qui n'existe nulle part ailleurs dans l'ERP, sur le seul bouton
       * d'une ligne de tableau. `title` n'est pas un nom accessible non plus — un bouton
       * sans texte visible a besoin d'un `aria-label`.
       */}
      <Button
        aria-label={`Modifier le type de ${turboy.prenoms} ${turboy.nom}`}
        isIconOnly
        onPress={() => setOpenEdit(true)}
        size="sm"
        variant="ghost"
      >
        <Edit2 aria-hidden="true" className="size-4" />
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
          <Avatar className="size-9 shrink-0">
            {turboy.avatarUrl && (
              <Avatar.Image alt={`${turboy.prenoms} ${turboy.nom}`} src={turboy.avatarUrl} />
            )}
            <Avatar.Fallback>{getInitials(`${turboy.prenoms} ${turboy.nom}`)}</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {turboy.prenoms} {turboy.nom}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Phone aria-hidden="true" className="size-3.5" /> {tel}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Mail aria-hidden="true" className="size-3.5" /> {email}
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
        <Chip color={display.chipColor} size="sm" variant="soft">
          <Chip.Label>{display.label}</Chip.Label>
        </Chip>
      );
    },
  },
  {
    accessorKey: 'salaire',
    header: 'Salaire',
    cell: ({ row }) => {
      const salaire = row.original.salaire;
      return (
        <span className="block text-right text-sm tabular-nums">
          {salaire ? `${formatMontant(salaire)}` : '-'}
        </span>
      );
    },
  },
  {
    accessorKey: 'commission',
    header: 'Commission',
    cell: ({ row }) => {
      const commission = row.original.commission;
      return (
        <span className="block text-right text-sm tabular-nums">
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
      return <span className="text-sm tabular-nums">{immatriculation || '-'}</span>;
    },
  },
  {
    accessorKey: 'matricule',
    header: 'Matricule',
    cell: ({ row }) => {
      const matricule = row.original.matricule;
      return <span className="text-sm tabular-nums">{matricule || '-'}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Chip color={getStatusColor(status)} size="sm" variant="soft">
          <Chip.Label>{getStatusLabel(status)}</Chip.Label>
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
