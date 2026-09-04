'use client';

import React from 'react';
import { Button, Tooltip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArchiveRestore } from 'lucide-react';
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
  if (!agent) return <span className="text-muted">—</span>;
  const formatted = formatDateTime(date);
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-foreground">{`${agent.prenoms} ${agent.nom}`}</span>
      {formatted && <span className="text-[11px] text-muted">{formatted}</span>}
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
      <Tooltip>
        <span className="line-clamp-2 max-w-56 text-xs">{row.original.nomZone ?? 'Inconnue'}</span>
        <Tooltip.Content>{row.original.nomZone ?? 'Zone inconnue'}</Tooltip.Content>
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
      if (!motif) return <span className="text-muted">—</span>;
      return (
        <Tooltip>
          <span className="line-clamp-2 max-w-56 text-xs">{motif}</span>
          <Tooltip.Content>{motif}</Tooltip.Content>
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
        <Tooltip>
          <Button
            aria-label="Restaurer ce ticket"
            isIconOnly
            isPending={isRestoring}
            onPress={() => meta.onRestoreRow(row.original.commandeId)}
            size="sm"
            variant="primary"
          >
            <ArchiveRestore aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content>Restaurer ce ticket</Tooltip.Content>
        </Tooltip>
      );
    },
  },
];
