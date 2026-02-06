import { ColumnDef } from '@tanstack/react-table';
import { IInvestissement } from '@/feature-finance/revenus/types/revenus.types';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InvestDetailModal } from './invest-detail-modal';
import { ModifierInvestModal } from '../modifier/modifier-invest-modal';
import SupprimerInvestModal from '../supprimer/supprimer-invest-modal';
import { differenceInDays } from 'date-fns';

// Fonction pour déterminer la couleur de l'échéance
const getDeadlineColor = (deadline: string): string => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const daysUntilDeadline = differenceInDays(deadlineDate, today);

  if (daysUntilDeadline < 7) {
    return 'text-red-600 font-bold'; // Rouge si moins d'une semaine
  } else if (daysUntilDeadline < 30) {
    return 'text-orange-600 font-semibold'; // Orange si moins d'un mois
  } else {
    return 'text-green-600'; // Vert sinon
  }
};

export const investissementColumns: ColumnDef<IInvestissement>[] = [
  {
    accessorKey: 'dateInvestissement',
    header: 'Date',
    cell: (info) => <div className="font-medium">{formatDateFR(info.getValue() as string)}</div>,
  },
  {
    accessorKey: 'nomInvestisseur',
    header: 'Investisseur',
    cell: (info) => (
      <div>
        <span className="font-semibold rounded-full px-2 py-1">{info.getValue() as string}</span>
      </div>
    ),
  },
  {
    accessorKey: 'montant',
    header: 'Montant du prêt',
    cell: (info) => formatCFA(info.getValue() as number),
  },
  {
    accessorKey: 'deadline',
    header: 'Échéance',
    cell: (info) => {
      const deadline = info.getValue() as string;
      const colorClass = getDeadlineColor(deadline);
      return <div className={colorClass}>{formatDateFR(deadline)}</div>;
    },
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: (info) => {
      const investissement = info.row.original;
      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4 cursor-pointer" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <InvestDetailModal investissement={investissement} />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ModifierInvestModal investissement={investissement} />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <SupprimerInvestModal investissement={investissement} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

