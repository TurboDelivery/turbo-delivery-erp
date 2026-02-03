import { ColumnDef } from '@tanstack/react-table';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye } from 'lucide-react';
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
};
const getStatutBadgeVariant = (statut: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (statut?.toUpperCase()) {
    case 'PAYEE':
    case 'PAID':
      return 'default';
    case 'EN_ATTENTE':
    case 'PENDING':
      return 'secondary';
    case 'ANNULEE':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
};
export const factureTableColumns: ColumnDef<IFacture>[] = [
  {
    accessorKey: 'restaurantName',
    header: 'Restaurant',
    cell: ({ row }) => <span className="font-semibold">{row.original.restaurantName}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
  },
  {
    accessorKey: 'periodeDebut',
    header: 'Période Début',
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.periodeDebut)}</span>,
  },
  {
    accessorKey: 'periodeFin',
    header: 'Période Fin',
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.periodeFin)}</span>,
  },
  {
    accessorKey: 'montant',
    header: 'Montant',
    cell: ({ row }) => <span className="font-bold">{formatCFA(row.original.montant || 0)}</span>,
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant={getStatutBadgeVariant(row.original.statut)} className="capitalize">
        {row.original.statut}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Création',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <MoreHorizontal className="h-4 w-4 cursor-pointer" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            <span>Voir détails</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];
