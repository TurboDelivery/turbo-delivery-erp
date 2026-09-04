import { ColumnDef } from '@tanstack/react-table';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export const formatCfa = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export { formatDateFr };

export const getStatusClassName = (status: string) => {
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

  return 'bg-surface-secondary text-foreground';
};

export const getSalaryStatusClassName = (status: string) => {
  if (status === 'PAID') {
    return 'bg-green-100 text-green-700';
  }
  return 'bg-red-100 text-red-700';
};

export const createPayrollTableColumns = (onPayClick?: (payroll: IPayroll) => void): ColumnDef<IPayroll>[] => [
  {
    accessorKey: 'name',
    header: 'Employé',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name || '-'}</span>
        <span className="text-xs text-muted">{row.original.email || '-'}</span>
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
    header: 'Département',
    cell: ({ row }) => <span>{row.original.department || '-'}</span>,
  },
  {
    accessorKey: 'salaryBrut',
    header: 'Salaire brut',
    cell: ({ row }) => <span className="font-medium">{formatCfa(row.original.salaryBrut)}</span>,
  },
  {
    accessorKey: 'totalDeductionsPending',
    header: 'Déductions en attente',
    cell: ({ row }) => <span className="text-amber-700">{formatCfa(row.original.totalDeductionsPending)}</span>,
  },
  {
    accessorKey: 'totalDeductionsPaid',
    header: 'Déductions payées',
    cell: ({ row }) => <span className="text-green-700">{formatCfa(row.original.totalDeductionsPaid)}</span>,
  },
  {
    accessorKey: 'netToPay',
    header: 'Net a payer',
    cell: ({ row }) => <span className="font-semibold">{formatCfa(row.original.netToPay)}</span>,
  },
  {
    accessorKey: 'salary_status',
    header: 'Statut paiement',
    cell: ({ row }) => (
      <Badge className={cn('capitalize text-nowrap', getSalaryStatusClassName(row.original.salary_status))}>
        {row.original.salary_status === 'PAID' ? 'Payé' : 'Non payé'}
      </Badge>
    ),
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
    header: 'Date entrée',
    cell: ({ row }) => <span>{formatDateFr(row.original.entryDate)}</span>,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Dernière maj',
    cell: ({ row }) => <span>{formatDateFr(row.original.updatedAt, 'dd MMM yyyy HH:mm')}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={row.original.salary_status === 'PAID' ? 'outline' : 'default'}
          disabled={row.original.salary_status === 'PAID'}
          onClick={() => onPayClick?.(row.original)}
        >
          {row.original.salary_status === 'PAID' ? 'Payé' : 'Payer'}
        </Button>
      </div>
    ),
  },
];

