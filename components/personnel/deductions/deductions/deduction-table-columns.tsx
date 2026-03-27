import { ColumnDef } from '@tanstack/react-table';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@heroui/react';
import { Pencil, Trash2 } from 'lucide-react';
import { IDeduction } from '@/features/personnel/types/deduction.types';

type CreateDeductionTableColumnsOptions = {
  onEditDeduction?: (deduction: IDeduction) => void;
  onDeleteDeduction?: (deduction: IDeduction) => void;
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date && isValid(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }

  return null;
};

const formatDateFr = (value: unknown, dateFormat = 'dd MMM yyyy'): string => {
  const date = toDate(value);
  return date ? format(date, dateFormat, { locale: fr }) : '-';
};

const formatCfa = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const getTypeLabel = (type: IDeduction['typeDeduction']) => {
  switch (type) {
    case 'AVANCE':
      return 'Avance';
    case 'PRET':
      return 'Pret';
    case 'ABSENCE':
      return 'Absence';
    case 'RETARD':
      return 'Retard';
    default:
      return type;
  }
};

const getTypeClassName = (type: IDeduction['typeDeduction']) => {
  switch (type) {
    case 'AVANCE':
      return 'bg-blue-100 text-blue-700';
    case 'PRET':
      return 'bg-purple-100 text-purple-700';
    case 'ABSENCE':
      return 'bg-red-100 text-red-700';
    case 'RETARD':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: IDeduction['status']) => {
  switch (status) {
    case 'PENDING':
      return 'En attente';
    case 'PAID':
      return 'Paye';
    case 'CANCELLED':
      return 'Annule';
    default:
      return status;
  }
};

const getStatusClassName = (status: IDeduction['status']) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'PAID':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const createDeductionTableColumns = ({ onEditDeduction, onDeleteDeduction }: CreateDeductionTableColumnsOptions = {}): ColumnDef<IDeduction>[] => [
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
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeClassName(row.original.typeDeduction)}`}>
        {getTypeLabel(row.original.typeDeduction)}
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
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(row.original.status)}`}>
        {getStatusLabel(row.original.status)}
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

      if (isPret) {
        return <span className="text-xs text-gray-500">Bientot</span>;
      }

      return (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="light" color="primary" isIconOnly onPress={() => onEditDeduction?.(row.original)} title="Modifier">
            <Pencil className="size-4" />
          </Button>
          <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => onDeleteDeduction?.(row.original)} title="Supprimer">
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];

