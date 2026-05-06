import { ColumnDef } from '@tanstack/react-table';
import { IRestaurantRecouvrement } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { IconFileInvoice } from '@tabler/icons-react';
import { CreerRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/creer-recouvrement-modal';

export const restaurantRecouvrementTableColumns: ColumnDef<IRestaurantRecouvrement>[] = [
  {
    accessorKey: 'nomRestaurant',
    header: 'Partenaire',
    cell: ({ row }) => <span className="font-semibold">{row.original.nomRestaurant}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'totalFraisLivraisons',
    header: 'Total Livraison',
    cell: ({ row }) => <span>{formatCFA(row.original.totalFraisLivraisons || 0)}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'totalCommission',
    header: 'Total Commission',
    cell: ({ row }) => <span>{formatCFA(row.original.totalCommission || 0)}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'totalFacture',
    header: 'Total Facture',
    cell: ({ row }) => <span className="font-bold">{formatCFA(row.original.totalFacture || 0)}</span>,
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline">
              <MoreHorizontal className="h-4 w-4 cursor-pointer" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/finance/recouvrement/${row.original.id}/factures`}>
                <IconFileInvoice className="h-4 w-4 mr-2" />
                <span>Factures</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <CreerRecouvrementModal restaurantId={row.original.id} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
