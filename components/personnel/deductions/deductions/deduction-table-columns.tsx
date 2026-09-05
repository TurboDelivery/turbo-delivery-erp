import { Button, Tooltip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, XCircle } from 'lucide-react';

import {
  ChipStatutDeduction,
  ChipTypeDeduction,
} from '@/components/personnel/deductions/deductions/chips-deduction';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { formatCfa, formatDateFr } from '@/lib/date-utils';

type CreateDeductionTableColumnsOptions = {
  onEditDeduction?: (deduction: IDeduction) => void;
  onCancelDeduction?: (deduction: IDeduction) => void;
  onDeleteDeduction?: (deduction: IDeduction) => void;
};

/**
 * Boutons d'action d'une déduction (modifier / annuler / supprimer) — partagés
 * par la colonne du tableau et la carte mobile pour garantir une logique
 * d'activation identique (prêt non modifiable, déduction déjà annulée…).
 */
export const renderDeductionActions = (
  deduction: IDeduction,
  handlers: {
    onEditDeduction?: (deduction: IDeduction) => void;
    onCancelDeduction?: (deduction: IDeduction) => void;
    onDeleteDeduction?: (deduction: IDeduction) => void;
  } = {},
) => {
  const isPret = deduction.typeDeduction === 'PRET';
  const isCancelled = deduction.status === 'CANCELLED';

  return (
    <div className="flex items-center gap-1">
      {/*
       * `danger-soft` sur les deux gestes qui DEFONT, `ghost` sur celui qui modifie :
       * la v2 peignait « Modifier » en `color="primary"` et les deux autres en
       * `color="danger"` plein, ce qui mettait trois boutons colores par ligne. Et le
       * `title=` du HTML n'est pas annonce de facon fiable : un `aria-label` porte le
       * nom, une infobulle le montre.
       */}
      <Tooltip>
        <Button
          aria-label={isPret ? 'Modification du prêt désactivée' : 'Modifier la déduction'}
          isDisabled={isPret}
          isIconOnly
          onPress={() => handlers.onEditDeduction?.(deduction)}
          size="sm"
          variant="ghost"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>
          {isPret ? 'Modification du prêt désactivée' : 'Modifier'}
        </Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Button
          aria-label={isCancelled ? 'Déduction déjà annulée' : 'Annuler la déduction'}
          isDisabled={isCancelled}
          isIconOnly
          onPress={() => handlers.onCancelDeduction?.(deduction)}
          size="sm"
          variant="danger-soft"
        >
          <XCircle aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>{isCancelled ? 'Déduction déjà annulée' : 'Annuler'}</Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Button
          aria-label="Supprimer la déduction"
          isIconOnly
          onPress={() => handlers.onDeleteDeduction?.(deduction)}
          size="sm"
          variant="danger-soft"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Supprimer</Tooltip.Content>
      </Tooltip>
    </div>
  );
};

export const createDeductionTableColumns = ({ onEditDeduction, onCancelDeduction, onDeleteDeduction }: CreateDeductionTableColumnsOptions = {}): ColumnDef<IDeduction>[] => [
  {
    accessorKey: 'employee',
    header: 'Employé',
    cell: ({ row }) => {
      const employee = row.original.employee;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{employee?.name ?? '-'}</span>
          <span className="text-xs text-muted">{employee?.email ?? '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'typeDeduction',
    header: 'Type',
    cell: ({ row }) => (
      <ChipTypeDeduction type={row.original.typeDeduction} />
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Montant',
    cell: ({ row }) => <span className="font-medium">{formatCfa(row.original.amount)}</span>,
  },
  {
    accessorKey: 'deductionDate',
    header: 'Date déduction',
    cell: ({ row }) => <span>{formatDateFr(row.original.deductionDate)}</span>,
  },
  {
    accessorKey: 'payrollMonth',
    header: 'Mois de paie',
    cell: ({ row }) => <span>{formatDateFr(row.original.payrollMonth, 'MMM yyyy')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <ChipStatutDeduction statut={row.original.status} />
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-80">
        {row.original.description?.trim() || '-'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => renderDeductionActions(row.original, { onEditDeduction, onCancelDeduction, onDeleteDeduction }),
  },
];
