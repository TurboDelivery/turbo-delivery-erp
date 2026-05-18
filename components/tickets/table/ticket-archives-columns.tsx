'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArchiveRestore, Loader2 } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Checkbox } from '@/components/ui/checkbox';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { IArchiveBonLivraisonVm } from '@/features/tickets/types/tickets.type';

export interface TicketArchivesColumnMeta {
  onRestoreRow: (commandeId: string) => void;
  isRestoringId: string | null;
  canRestore: boolean;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy à HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
}

interface AgentCellProps {
  agent: { nom: string; prenoms: string } | null | undefined;
  date?: string | null;
}

function AgentCell({ agent, date }: AgentCellProps) {
  if (!agent) return <span className="text-gray-400">—</span>;
  const formatted = formatDateTime(date);
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-gray-800 font-medium">{`${agent.prenoms} ${agent.nom}`}</span>
      {formatted && <span className="text-[11px] text-gray-500">{formatted}</span>}
    </div>
  );
}

export const ticketArchivesColumns: ColumnDef<IArchiveBonLivraisonVm>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tout sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Sélectionner la ligne" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'reference',
    header: 'Code Check',
    cell: ({ row }) => <span className="text-xs">{row.original.reference}</span>,
  },
  {
    accessorKey: 'livreur',
    header: 'Livreur',
    cell: ({ row }) => <span className="text-xs">{row.original.livreur}</span>,
  },
  {
    accessorKey: 'restaurant',
    header: 'Partner',
    cell: ({ row }) => <span className="text-xs text-blue-500">{row.original.restaurant}</span>,
  },
  {
    accessorKey: 'nomZone',
    header: 'Zone',
    cell: ({ row }) => (
      <Tooltip className="text-xs" content={row.original.nomZone}>
        <span className="text-xs text-wrap line-clamp-2 max-w-56">{row.original.nomZone ?? 'Inconnue'}</span>
      </Tooltip>
    ),
  },
  {
    accessorKey: 'coutLivraison',
    header: 'Montant de Livraison',
    cell: ({ row }) => <span className="text-xs">{formatCFA(row.original.coutLivraison)}</span>,
  },
  {
    accessorKey: 'coutCommande',
    header: 'Montant de Commande',
    cell: ({ row }) => <span className="text-xs">{formatCFA(row.original.coutCommande)}</span>,
  },
  {
    accessorKey: 'commission',
    header: 'Commission',
    cell: ({ row }) => <span className="text-xs">{formatCFA(row.original.commission ?? 0)}</span>,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <span className="text-xs">{formatDateFR(row.original.date)}</span>,
  },
  {
    accessorKey: 'heure',
    header: 'Heure',
    cell: ({ row }) => <span className="text-xs">{formatHoursMinutes(row.original.heure)}</span>,
  },
  {
    id: 'deletedAt',
    header: 'Supprimé',
    enableSorting: false,
    cell: ({ row }) => <AgentCell agent={row.original.deletedByUser} date={row.original.deletedAt} />,
  },
  {
    id: 'motifAnnulation',
    header: 'Motif',
    enableSorting: false,
    cell: ({ row }) => {
      const motif = row.original.motifAnnulation;
      if (!motif) return <span className="text-gray-400">—</span>;
      return (
        <Tooltip className="text-xs" content={motif}>
          <span className="text-xs text-wrap line-clamp-2 max-w-56">{motif}</span>
        </Tooltip>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketArchivesColumnMeta;
      if (!meta.canRestore) return null;
      const isRestoring = meta.isRestoringId === row.original.commandeId;
      return (
        <Tooltip content="Restaurer ce ticket" size="sm">
          <button
            onClick={() => meta.onRestoreRow(row.original.commandeId)}
            disabled={isRestoring}
            className="px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 flex items-center justify-center disabled:opacity-50"
          >
            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
          </button>
        </Tooltip>
      );
    },
  },
];
