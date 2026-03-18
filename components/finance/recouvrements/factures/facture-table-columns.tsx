import { ColumnDef } from '@tanstack/react-table';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import FacturePdfViewer from '@/components/finance/recouvrements/factures/pdf/facture-pdf-viewer';
import { ValiderFactureDialog } from '@/components/finance/recouvrements/factures/valider-facture-dialog';
import React, { useState } from 'react';
import { Tooltip } from '@heroui/react';
import { getStatutBadgeVariant, getStatutColor, getStatutLabel } from '@/features/recouvrements/utils/facture.utils';
import { cn } from '@/lib/utils';

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
};

// Composant pour les actions de facture
const FactureActions = ({ facture }: { facture: IFacture }) => {
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const canValidate = facture.statut?.toUpperCase() === 'DRAFT';

  return (
    <>
      <div className="flex items-center space-x-2">
        <FacturePdfViewer factureId={facture.id} />
        {canValidate && (
          <Tooltip content="Valider la facture">
            <Button size={'icon'} onClick={() => setShowValidateDialog(true)} variant="secondary">
              <CheckCircle className="size-4" />
            </Button>
          </Tooltip>
        )}
      </div>

      <ValiderFactureDialog facture={facture} open={showValidateDialog} onOpenChange={setShowValidateDialog} />
    </>
  );
};

export const factureTableColumns: ColumnDef<IFacture>[] = [
  {
    accessorKey: 'restaurantName',
    header: 'Restaurant',
    cell: ({ row }) => <span className="font-semibold">{row.original.restaurantName}</span>,
  },
  {
    accessorKey: 'code',
    header: 'Référence',
    cell: ({ row }) => <span>{row.original.code}</span>,
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
    header: 'Montant Total',
    cell: ({ row }) => <span className="font-bold">{formatCFA(row.original.montant || 0)}</span>,
  },
  {
    accessorKey: 'restant',
    header: 'Montant Restant',
    cell: ({ row }) => {
      const montantRestant = (row.original.montant || 0) - (row.original.montantRegle || 0);
      const isFullyPaid = montantRestant <= 0;
      
      return (
        <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
          {formatCFA(Math.max(0, montantRestant))}
        </span>
      );
    },
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const hasContestation = row.original.contestationActive > 0;
      return (
        <div className="flex items-center gap-2">
          <Badge variant={getStatutBadgeVariant(row.original.statut)} className={cn('capitalize text-nowrap', getStatutColor(row.original.statut))}>
            {getStatutLabel(row.original.statut)}
          </Badge>
          {hasContestation && (
            <Tooltip content={`${row.original.contestationActive} contestation${row.original.contestationActive > 1 ? 's' : ''} active${row.original.contestationActive > 1 ? 's' : ''}`}>
              <div className="flex items-center gap-1 text-red-600 cursor-pointer">
                <AlertCircle className="size-4" />
                <span className="text-xs font-semibold">{row.original.contestationActive}</span>
              </div>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Création',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <FactureActions facture={row.original} />,
    enableSorting: false,
  },
];
