import { ColumnDef } from '@tanstack/react-table';
import { IDepense } from '@/features/depenses/types/depense.type';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ModifierDepenseModal } from '@/feature-finance/depenses/components/modifier/modifier-depenses-modal';
import SupprimerDepenseModal from '@/feature-finance/depenses/components/supprimer/suprime-depense';
import React from 'react';
import { Badge } from '@/components/ui/badge';

// Fonction pour formater le type de dépense
const formatTypeDepense = (typeDepense: string | null | undefined): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'square' | null | undefined;
} => {
  if (!typeDepense) return { label: 'Variable', variant: 'outline' };

  switch (typeDepense.toUpperCase()) {
    case 'QUOTIDIEN':
      return { label: 'Quotidien', variant: 'destructive' };
    case 'HEBDOMADAIRE':
      return { label: 'Hebdomadaire', variant: 'default' };
    case 'MENSUEL':
      return { label: 'Mensuel', variant: 'secondary' };
    case 'ANNUEL':
      return { label: 'Annuel', variant: 'square' };
    default:
      return { label: typeDepense, variant: 'secondary' };
  }
};

// Composant mémorisé pour les actions
const DepenseActions = React.memo(({ depense }: { depense: IDepense }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/*<DropdownMenuItem onSelect={(e) => e.preventDefault()}>*/}
        {/*  <DepenseDetailModal depense={depense} />*/}
        {/*</DropdownMenuItem>*/}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <ModifierDepenseModal depense={depense} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <SupprimerDepenseModal depense={depense} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

DepenseActions.displayName = 'DepenseActions';

export const depenseColumns: ColumnDef<IDepense>[] = [
  {
    id: 'date_depense',
    accessorKey: 'dateDepense',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.original.dateDepense);
      return format(date, 'dd/MM/yyyy');
    },
    enableSorting: false,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description,
    enableSorting: false,
  },
  {
    id: 'categorie',
    accessorFn: (row) => row.categorie?.nomCategorie ?? '',
    header: 'Catégorie',
    cell: ({ row }) => row.original.categorie?.nomCategorie ?? '-',
    enableSorting: false,
  },
  {
    id: 'typeDepense',
    accessorKey: 'typeDepense',
    header: 'Type de dépense',
    cell: ({ row }) => {
      const typeInfo = formatTypeDepense(row.original.typeDepense);
      return (
        <Badge variant={typeInfo.variant}>
          {typeInfo.label}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: 'montant',
    accessorKey: 'montant',
    header: 'Montant',
    cell: ({ row }) => {
      const montant = row.original.montant;
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(montant);
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => <DepenseActions depense={row.original} />,
    enableSorting: false,
  },
];
