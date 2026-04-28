import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@heroui/react';
import { Pencil, Trash2, XCircle } from 'lucide-react';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { formatCfa, formatDateFr } from '@/lib/date-utils';
import {
  getDeductionTypeLabel,
  getDeductionTypeClassName,
  getDeductionStatusLabel,
  getDeductionStatusClassName,
} from '@/features/personnel/utils/deduction.utils';

type CreateDeductionTableColumnsOptions = {
  onEditDeduction?: (deduction: IDeduction) => void;
  onCancelDeduction?: (deduction: IDeduction) => void;
  onDeleteDeduction?: (deduction: IDeduction) => void;
};

export const createDeductionTableColumns = ({ onEditDeduction, onCancelDeduction, onDeleteDeduction }: CreateDeductionTableColumnsOptions = {}): ColumnDef<IDeduction>[] => [
  {
    accessorKey: 'employee',
    header: 'Employe',
    cell: ({ row }) => {
      const employee = row.original.employee;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{employee?.name ?? '-'}</span>
          <span className="text-xs text-gray-500">{employee?.email ?? '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'typeDeduction',
    header: 'Type',
    cell: ({ row }) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getDeductionTypeClassName(row.original.typeDeduction)}`}>
        {getDeductionTypeLabel(row.original.typeDeduction)}
      </span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Montant',
    cell: ({ row }) => <span className="font-medium">{formatCfa(row.original.amount)}</span>,
  },
  {
    accessorKey: 'deductionDate',
    header: 'Date deduction',
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
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getDeductionStatusClassName(row.original.status)}`}>
        {getDeductionStatusLabel(row.original.status)}
      </span>
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
    cell: ({ row }) => {
      const isPret = row.original.typeDeduction === 'PRET';
      const isCancelled = row.original.status === 'CANCELLED';

      return (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="light"
            color="primary"
            isIconOnly
            isDisabled={isPret}
            onPress={() => onEditDeduction?.(row.original)}
            title={isPret ? 'Modification du pret desactivee' : 'Modifier'}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            isDisabled={isCancelled}
            onPress={() => onCancelDeduction?.(row.original)}
            title={isCancelled ? 'Deduction deja annulee' : 'Annuler'}
          >
            <XCircle className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            onPress={() => onDeleteDeduction?.(row.original)}
            title="Supprimer"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];
