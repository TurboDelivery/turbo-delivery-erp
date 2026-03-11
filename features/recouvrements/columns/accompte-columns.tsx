import { ColumnDef } from '@tanstack/react-table';
import { IAccompte } from '@/features/recouvrements/types/accompte.types';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import React from 'react';

// Composant mémorisé pour les actions
const AccompteActions = React.memo(({ accompte }: { accompte: IAccompte }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {/* TODO: Ajouter le modal de modification */}
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {/* TODO: Ajouter le modal de suppression */}
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

AccompteActions.displayName = 'AccompteActions';

export const accompteColumns: ColumnDef<IAccompte>[] = [
  {
    id: 'dateAccompte',
    accessorKey: 'dateAccompte',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.original.dateAccompte);
      return format(date, 'dd/MM/yyyy');
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
    id: 'commentaire',
    accessorKey: 'commentaire',
    header: 'Commentaire',
    cell: ({ row }) => row.original.commentaire || '-',
    enableSorting: false,
  },
  {
    id: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      // Le statut peut être déduit du montant (0 = en attente, > 0 = validé)
      const montant = row.original.montant;
      let statut: string;
      
      if (montant > 0) {
        statut = 'validé';
      } else if (montant === 0) {
        statut = 'en_attente';
      } else {
        statut = 'inconnu';
      }
      
      const getStatutVariant = (statutValue: string) => {
        switch (statutValue) {
          case 'validé':
            return 'default' as const;
          case 'en_attente':
            return 'secondary' as const;
          case 'rejeté':
            return 'destructive' as const;
          default:
            return 'secondary' as const;
        }
      };

      return (
        <Badge variant={getStatutVariant(statut)}>
          {statut === 'validé' ? 'Validé' : 
           statut === 'en_attente' ? 'En attente' : 
           statut === 'rejeté' ? 'Rejeté' : statut}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => <AccompteActions accompte={row.original} />,
    enableSorting: false,
  },
];
