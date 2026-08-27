'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IEntreeCaisse } from '../types/entree-caisse.types';
import { ModifierEntreeCaisseModal } from '@/components/finance/entrees-caisse/modifier-entree-caisse-modal';
import { SupprimerEntreeCaisseModal } from '@/components/finance/entrees-caisse/supprimer-entree-caisse-modal';
import { EntreeCaisseStatutCell } from '@/components/finance/entrees-caisse/statut-cell';
import { formatMontant } from '@/utils/format.utils';

export const entreeCaisseColumns: ColumnDef<IEntreeCaisse>[] = [
  {
    accessorKey: 'libelle',
    header: 'Libellé',
  },
  {
    accessorKey: 'montant',
    header: 'Montant',
    cell: ({ row }) =>
      `${formatMontant(row.original.montant)}`,
  },
  {
    accessorKey: 'dateEntree',
    header: 'Date',
    cell: ({ row }) =>
      format(new Date(row.original.dateEntree), 'dd/MM/yyyy', { locale: fr }),
  },
  {
    accessorKey: 'paye',
    header: 'Statut',
    cell: ({ row }) => <EntreeCaisseStatutCell entree={row.original} />,
  },
  {
    accessorKey: 'commentaire',
    header: 'Commentaire',
    cell: ({ row }) => row.original.commentaire || '—',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2 justify-center">
        <ModifierEntreeCaisseModal entreeCaisse={row.original} />
        <SupprimerEntreeCaisseModal entreeCaisse={row.original} />
      </div>
    ),
  },
];
