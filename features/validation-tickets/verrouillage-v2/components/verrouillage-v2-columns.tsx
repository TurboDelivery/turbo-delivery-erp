'use client';

import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface RowActionsProps {
  ticket: BonLivraisonTerminee;
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
): ColumnDef<BonLivraisonTerminee>[] {
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
    },
    {
      accessorKey: 'coutLivraison',
      header: 'COMMISSION',
      enableSorting: false,
      cell: ({ row }) => <span>{formatCFA(row.original.coutLivraison)}</span>,
    },
    {
      accessorKey: 'nomZone',
      header: 'ZONE',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {row.original.nomZone ?? 'VERTE'}
        </span>
      ),
    },
    {
      id: 'v1ValidePar',
      header: 'V1 PAR',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-gray-700">{(row.original as any).v1ValidePar ?? '—'}</span>
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
