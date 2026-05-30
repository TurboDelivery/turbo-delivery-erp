'use client';

import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
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

/** Affiche un agent (nom + horodatage) — partagé entre colonne et carte mobile. */
export function AgentCell({ agent, date }: AgentCellProps) {
  if (!agent) return <span className="text-gray-400">—</span>;
  const formatted = formatDateTime(date);
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-gray-800 font-medium">{`${agent.prenoms} ${agent.nom}`}</span>
      {formatted && <span className="text-[11px] text-gray-500">{formatted}</span>}
    </div>
  );
}

interface RowActionsProps {
  ticket: TicketControleV2;
  isValidating: boolean;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

/** Actions d'une ligne V2 (Valider V2 / Rejeter) — partagé colonne + carte mobile. */
export const VerrouillageV2RowActions = memo(function VerrouillageV2RowActions({
  ticket,
  isValidating,
  onValidate,
  onReject,
  fullWidth = false,
}: RowActionsProps & { fullWidth?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className={`h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white ${fullWidth ? 'flex-1' : ''}`}
        onClick={() => onValidate(ticket.commandeId)}
        disabled={isValidating}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Valider V2
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className={`h-7 px-2 text-xs ${fullWidth ? 'flex-1' : ''}`}
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
  readOnly = false,
): ColumnDef<TicketControleV2>[] {
  const columns: ColumnDef<TicketControleV2>[] = [
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
      cell: ({ row }) => <span className="text-blue-500">{row.original.restaurant}</span>,
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
      cell: ({ row }) => <span>{formatCFA(row.original.coutCommande)}</span>,
    },
    {
      accessorKey: 'coutLivraison',
      header: 'MONTANT LIV.',
      enableSorting: false,
      cell: ({ row }) => <span>{formatCFA(row.original.coutLivraison)}</span>,
    },
    {
      accessorKey: 'commission',
      header: 'COMMISSION',
      enableSorting: false,
      cell: ({ row }) => <span>{row.original.commission != null ? formatCFA(row.original.commission) : '—'}</span>,
    },
    {
      accessorKey: 'nomZone',
      header: 'ZONE',
      enableSorting: false,
      cell: ({ row }) => {
        const zone = row.original.nomZone ?? 'VERTE';
        return (
          <span title={zone} className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 max-w-[160px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
            <span className="truncate">{zone}</span>
          </span>
        );
      },
    },
    {
      id: 'createdByUser',
      header: 'CRÉÉ PAR',
      enableSorting: false,
      cell: ({ row }) => <AgentCell agent={row.original.createdByUser} />,
    },
    {
      id: 'vauthAgent',
      header: 'AUTH PAR',
      enableSorting: false,
      cell: ({ row }) => <AgentCell agent={row.original.vauthAgent} date={row.original.vauthAt} />,
    },
    {
      id: 'v1Agent',
      header: 'V1 PAR',
      enableSorting: false,
      cell: ({ row }) => <AgentCell agent={row.original.v1Agent} date={row.original.v1ValideAt} />,
    },
    {
      id: 'v2Agent',
      header: 'V2 PAR',
      enableSorting: false,
      cell: ({ row }) => <AgentCell agent={row.original.v2Agent} date={row.original.v2ValideAt} />,
    },
  ];

  // Colonne d'actions (Valider V2 / Rejeter) masquée en lecture seule — ex. rôle
  // AGENT_V1 : Verrouillage V2 en consultation uniquement. Le gate se fait sur
  // 'manage VerrouillageV2' côté content (DG/DGA uniquement).
  if (!readOnly) {
    columns.push({
      id: 'actions',
      header: 'ACTIONS',
      enableSorting: false,
      cell: ({ row }) => (
        <VerrouillageV2RowActions
          ticket={row.original}
          isValidating={validatingId === row.original.commandeId}
          onValidate={onValidate}
          onReject={onReject}
        />
      ),
    });
  }

  return columns;
}
