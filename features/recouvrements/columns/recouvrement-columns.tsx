'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRecouvrement } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

export const recouvrementColumns: ColumnDef<IRecouvrement>[] = [
  {
    accessorKey: 'dateRecouvrement',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateRecouvrement'));
      return format(date, 'dd MMM yyyy', { locale: fr });
    },
  },
  {
    accessorKey: 'nomRestaurant',
    header: 'Restaurant',
    cell: ({ row }) => row.getValue('nomRestaurant') || '-',
  },
  {
    accessorKey: 'montant',
    header: 'Montant',
    cell: ({ row }) => formatCFA(row.getValue('montant')),
  },
  {
    accessorKey: 'totalFraisLivraisons',
    header: 'Frais de livraison',
    cell: ({ row }) => {
      const value = row.getValue('totalFraisLivraisons');
      return value ? formatCFA(value as number) : '-';
    },
  },
  {
    accessorKey: 'totalCommission',
    header: 'Commission',
    cell: ({ row }) => {
      const value = row.getValue('totalCommission');
      return value ? formatCFA(value as number) : '-';
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const recouvrement = row.original;

      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Ouvrir la modale de détail
              if (recouvrement.preuve) {
                window.open(recouvrement.preuve, '_blank');
              }
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

