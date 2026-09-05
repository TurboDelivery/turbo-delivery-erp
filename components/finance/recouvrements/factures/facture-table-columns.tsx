import { ColumnDef } from '@tanstack/react-table';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle, CheckCircle, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import FacturePdfViewer from '@/components/finance/recouvrements/factures/pdf/facture-pdf-viewer';
import { ValiderFactureDialog } from '@/components/finance/recouvrements/factures/valider-facture-dialog';
import { RecalculerFactureDialog } from '@/components/finance/recouvrements/factures/recalculer-facture-dialog';
import { ReinitialiserFactureDialog } from '@/components/finance/recouvrements/factures/reinitialiser-facture-dialog';
import { SupprimerFactureDialog } from '@/components/finance/recouvrements/factures/supprimer-facture-dialog';
import React, { useState } from 'react';
import { Button, Chip, Tooltip } from '@heroui-v3/react';
import { getStatutChip, getStatutLabel } from '@/features/recouvrements/utils/facture.utils';

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
};

// Composant pour les actions de facture — partagé colonne (desktop) + carte mobile.
export const FactureActions = ({ facture }: { facture: IFacture }) => {
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const canValidate = facture.statut?.toUpperCase() === 'DRAFT';
  // Réinitialiser n'a de sens qu'une fois la facture validée / en cours de recouvrement.
  const canReset = facture.statut?.toUpperCase() !== 'DRAFT';

  return (
    <>
      {/*
       * Les quatre gestes etaient des boutons shadcn habilles a la main —
       * `border-destructive/40 text-destructive hover:bg-destructive/10` recopie deux
       * fois — dans des info-bulles de la v2. Ce sont des `Button` de la bibliotheque,
       * et le ton destructeur vient de sa variante.
       */}
      <div className="flex items-center gap-2">
        <FacturePdfViewer factureId={facture.id} />

        <Tooltip>
          <Button
            aria-label="Recalculer le montant"
            isIconOnly
            onPress={() => setShowRecalculateDialog(true)}
            size="sm"
            variant="outline"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content>Recalculer le montant (même période)</Tooltip.Content>
        </Tooltip>

        {canValidate && (
          <Tooltip>
            <Button
              aria-label="Valider la facture"
              isIconOnly
              onPress={() => setShowValidateDialog(true)}
              size="sm"
              variant="secondary"
            >
              <CheckCircle aria-hidden="true" className="size-4" />
            </Button>
            <Tooltip.Content>Valider la facture</Tooltip.Content>
          </Tooltip>
        )}

        {canReset && (
          <Tooltip>
            <Button
              aria-label="Réinitialiser le recouvrement"
              isIconOnly
              onPress={() => setShowResetDialog(true)}
              size="sm"
              variant="danger-soft"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
            </Button>
            <Tooltip.Content>Réinitialiser (annuler tout le recouvrement)</Tooltip.Content>
          </Tooltip>
        )}

        <Tooltip>
          <Button
            aria-label="Supprimer la facture"
            isIconOnly
            onPress={() => setShowDeleteDialog(true)}
            size="sm"
            variant="danger-soft"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content>Supprimer définitivement (doublon / facture erronée)</Tooltip.Content>
        </Tooltip>
      </div>

      <ValiderFactureDialog facture={facture} open={showValidateDialog} onOpenChange={setShowValidateDialog} />
      <RecalculerFactureDialog facture={facture} open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog} />
      <ReinitialiserFactureDialog facture={facture} open={showResetDialog} onOpenChange={setShowResetDialog} />
      <SupprimerFactureDialog facture={facture} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
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
        // `text-green-600` / `text-red-600` etaient des teintes de palette, indifferentes
        // au theme sombre : les jetons `-soft-foreground` sont lisibles sur les deux fonds.
        <span
          className={
            isFullyPaid
              ? 'font-bold tabular-nums text-success-soft-foreground'
              : 'font-bold tabular-nums text-danger-soft-foreground'
          }
        >
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
      const chip = getStatutChip(row.original.statut);
      return (
        <div className="flex items-center gap-2">
          <Chip color={chip.color} size="sm" variant={chip.variant}>
            <Chip.Label>{getStatutLabel(row.original.statut)}</Chip.Label>
          </Chip>
          {hasContestation && (
            <Tooltip>
              <span className="flex cursor-help items-center gap-1 text-danger-soft-foreground">
                <AlertCircle aria-hidden="true" className="size-4" />
                <span className="text-xs font-semibold">{row.original.contestationActive}</span>
              </span>
              <Tooltip.Content>
                {row.original.contestationActive} contestation
                {row.original.contestationActive > 1 ? 's' : ''} active
                {row.original.contestationActive > 1 ? 's' : ''}
              </Tooltip.Content>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Création',
    cell: ({ row }) => <span className="text-sm text-muted">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <FactureActions facture={row.original} />,
    enableSorting: false,
  },
];
