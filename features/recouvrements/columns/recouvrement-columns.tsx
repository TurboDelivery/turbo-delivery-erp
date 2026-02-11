'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRecouvrement } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createUrlFile } from '@/utils/createUrlFile';

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
      const preuveUrl = row.original.preuve;

      const handleDownload = () => {
        if (preuveUrl) {
          const url = createUrlFile(preuveUrl, 'backend');
          window.open(url, '_blank');
        }
      };

      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!preuveUrl}>
            <Download className="size-4" />
            <span>Preuve</span>
          </Button>
        </div>
      );
    },
  },
];
