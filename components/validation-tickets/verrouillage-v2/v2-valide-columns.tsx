'use client';

import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import { XCircle } from 'lucide-react';
import { Button, Chip, Spinner } from '@heroui-v3/react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatDate(dateStr: string) {
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

function AgentCell({ agent, date }: AgentCellProps) {
  if (!agent) return <span className="text-muted">—</span>;
  const formatted = formatDateTime(date);
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-foreground font-medium">{`${agent.prenoms} ${agent.nom}`}</span>
      {formatted && <span className="text-[11px] text-muted">{formatted}</span>}
    </div>
  );
}

interface RowActionsProps {
  ticket: TicketControleV2;
  isRejecting: boolean;
  onReject: (id: string) => void;
}

/** Action « Rejeter » d'un ticket V2 validé — partagé colonne + carte mobile. */
export const V2ValideRowActions = memo(function V2ValideRowActions({
  ticket,
  isRejecting,
  onReject,
  fullWidth = false,
}: RowActionsProps & { fullWidth?: boolean }) {
  /*
   * `variant="destructive"` n'existe pas en v3 : la valeur aurait ete ignoree en silence
   * et le rejet d'un ticket deja verrouille se serait presente comme une action ordinaire.
   * `danger` est le nom de la meme intention dans la bibliotheque.
   *
   * Le bouton etait seulement grise pendant l'envoi (`disabled`), sans rien montrer :
   * l'operateur qui ne voyait aucune reaction reappuyait. `isPending` BLOQUE l'appui —
   * il pose `aria-disabled` et `data-pending`, donc grisage et clic inerte — mais il ne
   * DESSINE rien : la bibliotheque laisse le rond de chargement a la charge de l'appelant,
   * comme le font ses propres exemples. On rend donc le `Spinner` a la place de l'icone,
   * sans quoi l'attente resterait aussi muette qu'avec `disabled`.
   *
   * La hauteur, le rembourrage et la taille de texte etaient reecrits a la main
   * (`h-7 px-2 text-xs`) : `size="sm"` porte deja ce gabarit, et `w-full` devient la prop
   * `fullWidth` que la carte mobile demande pour une cible large au doigt.
   */
  return (
    <Button
      fullWidth={fullWidth}
      isPending={isRejecting}
      onPress={() => onReject(ticket.commandeId)}
      size="sm"
      variant="danger"
    >
      {isRejecting ? <Spinner color="current" size="sm" /> : <XCircle aria-hidden="true" />}
      Rejeter
    </Button>
  );
});

export function buildV2ValideColumns(
  onReject: (id: string) => void,
  rejectingId: string | null,
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
    /* `text-blue-500` etait ecrit sans variante sombre. Le bleu est la seule marque qui
       distingue le partenaire du reste de la ligne : il prend ses deux themes, et la meme
       paire que la carte mobile, pour que les deux surfaces se lisent pareil. */
    cell: ({ row }) => <span className="text-blue-600 dark:text-blue-400">{row.original.restaurant}</span>,
  },
  {
    accessorKey: 'date',
    header: 'DATE',
    enableSorting: false,
    cell: ({ row }) => <span>{formatDate(row.original.date)}</span>,
  },
  /* Les trois montants se comparent d'une ligne a la suivante : en chasse tabulaire les
     unites tombent les unes sous les autres, alors qu'en chasse proportionnelle un 1 et
     un 8 n'ont pas la meme largeur et les colonnes de chiffres ondulent. */
  {
    accessorKey: 'coutCommande',
    header: 'MONTANT CMD',
    enableSorting: false,
    cell: ({ row }) => <span className="tabular-nums">{formatCFA(row.original.coutCommande)}</span>,
  },
  {
    accessorKey: 'coutLivraison',
    header: 'MONTANT LIV.',
    enableSorting: false,
    cell: ({ row }) => <span className="tabular-nums">{formatCFA(row.original.coutLivraison)}</span>,
  },
  {
    accessorKey: 'commission',
    header: 'COMMISSION',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.commission != null ? formatCFA(row.original.commission) : '—'}</span>
    ),
  },
  {
    accessorKey: 'nomZone',
    header: 'ZONE',
    enableSorting: false,
    cell: ({ row }) => {
      const zone = row.original.nomZone ?? 'VERTE';
      /* La pastille etait ecrite en `border-green-500 bg-green-50 text-green-700`, sans
         variante sombre : depuis que la bascule de theme est dans l'en-tete, elle restait
         vert pastel sur fond fonce et se lisait mal. Le `Chip` en couleur success porte le
         meme sens avec ses deux themes. Le nom de zone est tronque faute de place, donc
         `title` garde le nom entier accessible au survol, comme sur la carte mobile. */
      return (
        <Chip className="max-w-[160px]" color="success" size="sm" title={zone} variant="soft">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
          <Chip.Label className="truncate">{zone}</Chip.Label>
        </Chip>
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

  // Action "Rejeter" masquée en lecture seule (ex. rôle AGENT_V1 : Verrouillage
  // V2 en consultation uniquement). Gate sur 'manage VerrouillageV2' côté content.
  if (!readOnly) {
    columns.push({
      id: 'actions',
      header: 'ACTIONS',
      enableSorting: false,
      cell: ({ row }) => (
        <V2ValideRowActions
          ticket={row.original}
          isRejecting={rejectingId === row.original.commandeId}
          onReject={onReject}
        />
      ),
    });
  }

  return columns;
}
