import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { IAbsence } from '@/features/personnel/types/absence.types';
import { IEmployee } from '@/features/personnel/types/types';
import { differenceInDays, format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const formatDateFr = (value: unknown): string => {
  const date = toDate(value);
  return date ? format(date, 'dd MMM yyyy', { locale: fr }) : '-';
};

const getDurationInDays = (start: unknown, end: unknown): string => {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) {
    return '-';
  }

  if (endDate < startDate) {
    return '-';
  }

  // +1 pour inclure le jour de debut dans la duree affichee.
  const days = differenceInDays(endDate, startDate) + 1;
  return `${days} j`;
};

const getTypeLabel = (type: string | undefined): string => {
  if (type === 'ABSENCE') return 'Absence';
  if (type === 'RETARD') return 'Retard';
  return '-';
};

type CreateAbsenceTableColumnsOptions = {
  onEditAbsence?: (absence: IAbsence) => void;
};

export const createAbsenceTableColumns = ({ onEditAbsence }: CreateAbsenceTableColumnsOptions = {}): ColumnDef<IAbsence>[] => [
  {
    accessorKey: 'employee',
    header: 'Employé',
    cell: ({ row }) => {
      const employee = row.original.employee as IEmployee | undefined;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{employee?.name ?? '-'}</span>
          <span className="text-xs text-gray-500">{employee?.email ?? '-'}</span>
        </div>
      );
    },
  },
  {
    id: 'periode',
    header: "Période d'absence",
    cell: ({ row }) => {
      const debut = row.original.dateDebut;
      const fin = row.original.dateFin;

      return (
        <div className="flex flex-col">
          <span>{`${formatDateFr(debut)} - ${formatDateFr(fin)}`}</span>
        </div>
      );
    },
  },
  {
    id: 'duree',
    header: 'Durée',
    cell: ({ row }) => <span>{getDurationInDays(row.original.dateDebut, row.original.dateFin)}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const typeLabel = getTypeLabel(row.original.type);
      const typeClassName =
        typeLabel === 'Retard'
          ? 'bg-amber-100 text-amber-700'
          : typeLabel === 'Absence'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600';

      return (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeClassName}`}>
          {typeLabel}
        </span>
      );
    },
  },
  {
    accessorKey: 'motif',
    header: 'Motif',
    cell: ({ row }) => {
      const motif = row.original.motif?.trim();
      return (
        <span className="line-clamp-2 max-w-80">
          {motif || '-'}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => (
      <Button
        size="sm"
        variant="light"
        color="primary"
        isIconOnly
        onPress={() => onEditAbsence?.(row.original)}
        title="Modifier"
      >
        <Pencil className="size-4" />
      </Button>
    ),
  },
];
