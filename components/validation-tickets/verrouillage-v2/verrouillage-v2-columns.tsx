'use client';

import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCfa } from '@/utils/format.utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

interface RowActionsProps {
  ticket: TicketControleV2;
  isValidating: boolean;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

const RowActions = memo(function RowActions({ ticket, isValidating, onValidate, onReject }: RowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
        onClick={() => onValidate(ticket.commandeId)}
        disabled={isValidating}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Valider V2
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 px-2 text-xs"
        onClick={() => onReject(ticket.commandeId)}
        disabled={isValidating}
      >
        <XCircle className="h-3.5 w-3.5 mr-1" />
        Rejeter
      </Button>
    </div>
  );
});

export function buildVerrouillageV2Columns(
  onValidate: (id: string) => void,
  onReject: (id: string) => void,
  validatingId: string | null,
): ColumnDef<TicketControleV2>[] {
  return [
    {
      accessorKey: 'reference',
      header: 'TICKET',
      enableSorting: false,
    },
    {
      accessorKey: 'livreur',
      header: 'LIVREUR',
      enableSorting: false,
    },
    {
      accessorKey: 'restaurant',
      header: 'PARTENAIRE',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-blue-500">{row.original.restaurant}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      enableSorting: false,
      cell: ({ row }) => <span>{formatDate(row.original.date)}</span>,
    },
    {
      accessorKey: 'coutCommande',
      header: 'MONTANT CMD',
      enableSorting: false,
      cell: ({ row }) => <span>{formatCfa(row.original.coutCommande)}</span>,
    },
    {
      accessorKey: 'coutLivraison',
      header: 'COMMISSION',
      enableSorting: false,
      cell: ({ row }) => <span>{formatCfa(row.original.coutLivraison)}</span>,
    },
    {
      accessorKey: 'nomZone',
      header: 'ZONE',
      enableSorting: false,
      cell: ({ row }) => {
        const zone = row.original.nomZone ?? 'VERTE';
        return (
          <span
            title={zone}
            className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 max-w-[160px]"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
            <span className="truncate">{zone}</span>
          </span>
        );
      },
    },
    {
      id: 'v1ValidePar',
      header: 'V1 PAR',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.v1Agent?.username ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          ticket={row.original}
          isValidating={validatingId === row.original.commandeId}
          onValidate={onValidate}
          onReject={onReject}
        />
      ),
    },
  ];
}
