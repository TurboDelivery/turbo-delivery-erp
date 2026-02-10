'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRecouvrement } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, Eye } from 'lucide-react';
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
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
          >
            <Download className="size-4" />
            <span>
              Preuve
            </span>
          </Button>
        </div>
      );
    },
  },
];

