import { ColumnDef } from '@tanstack/react-table';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import FacturePdfViewer from '@/components/finance/recouvrements/factures/pdf/facture-pdf-viewer';
import { ValiderFactureDialog } from '@/components/finance/recouvrements/factures/valider-facture-dialog';
import React, { useState } from 'react';
import { Tooltip } from '@heroui/react';
import { getStatutBadgeVariant, getStatutLabel } from '@/features/recouvrements/utils/facture.utils';

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
        <FacturePdfViewer />
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
    header: 'Montant',
    cell: ({ row }) => <span className="font-bold">{formatCFA(row.original.montant || 0)}</span>,
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant={getStatutBadgeVariant(row.original.statut)} className="capitalize">
        {getStatutLabel(row.original.statut)}
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
    header: '',
    cell: ({ row }) => <FactureActions facture={row.original} />,
    enableSorting: false,
  },
];
