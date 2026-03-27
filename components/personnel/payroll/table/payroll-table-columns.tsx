import { ColumnDef } from '@tanstack/react-table';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { IPayroll } from '@/features/personnel/types/payroll.types';

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

const getStatusClassName = (status: string) => {
  const normalized = status?.toUpperCase?.() || '';

  if (normalized.includes('PAID') || normalized.includes('PAYE')) {
    return 'bg-green-100 text-green-700';
  }

  if (normalized.includes('PENDING') || normalized.includes('ATTENTE')) {
    return 'bg-amber-100 text-amber-700';
  }

  if (normalized.includes('CANCEL')) {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
};

export const createPayrollTableColumns = (): ColumnDef<IPayroll>[] => [
  {
    accessorKey: 'name',
    header: 'Employe',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name || '-'}</span>
        <span className="text-xs text-gray-500">{row.original.email || '-'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'position',
    header: 'Poste',
    cell: ({ row }) => <span>{row.original.position || '-'}</span>,
  },
  {
    accessorKey: 'department',
    header: 'Departement',
    cell: ({ row }) => <span>{row.original.department || '-'}</span>,
  },
  {
    accessorKey: 'salaryBrut',
    header: 'Salaire brut',
    cell: ({ row }) => <span className="font-medium">{formatCfa(row.original.salaryBrut)}</span>,
  },
  {
    accessorKey: 'totalDeductionsPending',
    header: 'Deductions en attente',
    cell: ({ row }) => <span className="text-amber-700">{formatCfa(row.original.totalDeductionsPending)}</span>,
  },
  {
    accessorKey: 'totalDeductionsPaid',
    header: 'Deductions payees',
    cell: ({ row }) => <span className="text-green-700">{formatCfa(row.original.totalDeductionsPaid)}</span>,
  },
  {
    accessorKey: 'netToPay',
    header: 'Net a payer',
    cell: ({ row }) => <span className="font-semibold">{formatCfa(row.original.netToPay)}</span>,
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge className={cn('capitalize text-nowrap', getStatusClassName(row.original.statut))}>{row.original.statut || '-'}</Badge>
    ),
  },
  {
    accessorKey: 'entryDate',
    header: 'Date entree',
    cell: ({ row }) => <span>{formatDateFr(row.original.entryDate)}</span>,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Derniere maj',
    cell: ({ row }) => <span>{formatDateFr(row.original.updatedAt, 'dd MMM yyyy HH:mm')}</span>,
  },
];

