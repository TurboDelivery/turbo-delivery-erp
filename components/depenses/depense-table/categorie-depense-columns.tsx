import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { CategorieDetailModal } from '@/feature-finance/depenses/components/depense-list/detail/categorie-detail';
import { ModifierCategorieModal } from '@/feature-finance/depenses/components/modifier/modifier-categorie-modal';
import SupprimerCategorieModal from '@/feature-finance/depenses/components/supprimer/supprimer-categorie-modal';
import { Checkbox } from '@/components/ui/checkbox';

export const depenseColumns: ColumnDef<ICategorieDepense>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return format(date, 'dd/MM/yyyy');
    },
    enableSorting: false,
  },
  {
    id: 'nomCategorie',
    accessorKey: 'nomCategorie',
    header: 'Nom',
    cell: ({ row }) => row.original.description,
    enableSorting: false,
  },
  {
    id: '',
    accessorKey: 'totalDepense',
    header: 'Total des dépenses',
    cell: ({ row }) => {
      const totalDepense = row.original.totalDepense;
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalDepense);
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const categorie_depense = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline">
              <MoreHorizontal className="h-4 w-4 cursor-pointer" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <CategorieDetailModal categorie={categorie_depense} />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ModifierCategorieModal categorieDepense={categorie_depense} />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <SupprimerCategorieModal categorieDepense={categorie_depense} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
