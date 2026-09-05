import { Chip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
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

type TonPaie = 'danger' | 'default' | 'success';

/**
 * Le ton d'un statut de bulletin.
 *
 * <p>« En attente » était peint en ambre : c'est pourtant l'état NORMAL d'un bulletin
 * du mois en cours, et l'ambre y annonçait un problème qui n'existe pas. Reste ce qui
 * dit vraiment quelque chose : payé (bon), annulé (défait).</p>
 */
export const getStatusTon = (status: string): TonPaie => {
  const normalized = status?.toUpperCase?.() || '';
  if (normalized.includes('PAID') || normalized.includes('PAYE')) return 'success';
  if (normalized.includes('CANCEL')) return 'danger';
  return 'default';
};

/**
 * Le salaire est-il versé.
 *
 * <p>C'était binaire vert/ROUGE : un salaire pas encore versé le 3 du mois s'affichait
 * en rouge sur toute la colonne, comme un impayé. Non versé n'est pas une faute, c'est
 * l'état de départ.</p>
 */
export const getSalaryStatusTon = (status: string): TonPaie =>
  status === 'PAID' ? 'success' : 'default';

/** La pastille de statut, montée une fois pour la colonne et pour la carte tactile. */
export const ChipStatutPaie = ({ statut, ton }: { statut: string; ton: TonPaie }) => (
  <Chip color={ton} size="sm" variant="soft">
    <Chip.Label className="whitespace-nowrap capitalize">{statut || '-'}</Chip.Label>
  </Chip>
);

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
    /* Un montant deduit n'est pas une bonne nouvelle : le vert n'y disait rien. */
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">{formatCfa(row.original.totalDeductionsPaid)}</span>
    ),
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
      <ChipStatutPaie
        statut={row.original.salary_status === 'PAID' ? 'Payé' : 'Non payé'}
        ton={getSalaryStatusTon(row.original.salary_status)}
      />
    ),
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => (
      <ChipStatutPaie statut={row.original.statut} ton={getStatusTon(row.original.statut)} />
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

