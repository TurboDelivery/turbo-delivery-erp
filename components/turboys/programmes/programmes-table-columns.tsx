'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button, Chip } from '@heroui/react';
import { IProgramme } from '@/features/turboys/types/programme.types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

const STATUT_UI: Record<string, { label: string; color: ChipColor }> = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  PLANIFIE: { label: 'Planifié', color: 'secondary' },
  NOTIFIE: { label: 'Notifié', color: 'warning' },
  ACCEPTE: { label: 'Accepté', color: 'success' },
  REFUSE: { label: 'Refusé', color: 'danger' },
};

const formatDateHeure = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export interface ProgrammeRowHandlers {
  onEdit: (p: IProgramme) => void;
  onPlanifier: (p: IProgramme) => void;
  onPublier: (p: IProgramme) => void;
  pendingId?: string | null;
}

export const buildProgrammeColumns = (h: ProgrammeRowHandlers): ColumnDef<IProgramme>[] => [
  {
    accessorKey: 'livreurNom',
    header: 'Livreur',
    cell: ({ row }) => <span className="font-medium">{row.original.livreurNom ?? '—'}</span>,
  },
  {
    id: 'jours',
    header: 'Jours travaillés',
    cell: ({ row }) => {
      const actifs = (row.original.jours ?? []).filter((j) => j.actif).length;
      return (
        <span className="text-sm text-default-600">
          {actifs} jour{actifs > 1 ? 's' : ''} actif{actifs > 1 ? 's' : ''}
        </span>
      );
    },
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const ui = STATUT_UI[row.original.statut ?? ''] ?? { label: row.original.statut ?? '—', color: 'default' as ChipColor };
      return (
        <Chip size="sm" variant="flat" color={ui.color}>
          {ui.label}
        </Chip>
      );
    },
  },
  {
    accessorKey: 'publieLe',
    header: 'Publié le',
    cell: ({ row }) => <span className="text-sm text-default-500">{formatDateHeure(row.original.publieLe)}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const p = row.original;
      const s = p.statut;
      const busy = h.pendingId === p.id;
      return (
        <div className="flex flex-wrap gap-1">
          {s === 'BROUILLON' && (
            <Button size="sm" variant="flat" onPress={() => h.onEdit(p)} isDisabled={busy}>
              Éditer
            </Button>
          )}
          {s === 'BROUILLON' && (
            <Button size="sm" variant="flat" color="secondary" onPress={() => h.onPlanifier(p)} isLoading={busy}>
              Planifier
            </Button>
          )}
          {(s === 'BROUILLON' || s === 'PLANIFIE') && (
            <Button size="sm" color="primary" onPress={() => h.onPublier(p)} isLoading={busy}>
              Publier
            </Button>
          )}
          {s === 'REFUSE' && p.motifRefus && (
            <span className="text-xs italic text-danger" title={p.motifRefus}>
              Refusé : {p.motifRefus.length > 30 ? `${p.motifRefus.slice(0, 30)}…` : p.motifRefus}
            </span>
          )}
        </div>
      );
    },
  },
];
