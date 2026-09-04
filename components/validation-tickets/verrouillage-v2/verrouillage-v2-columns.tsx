'use client';

import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button, Chip, Spinner, Tooltip } from '@heroui-v3/react';
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
  isValidating: boolean;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

/**
 * Actions d'une ligne V2 (Valider V2 / Rejeter), partagees entre la colonne du tableau
 * et la carte mobile.
 *
 * <h3>Ce qui change</h3>
 * <ul>
 *   <li>Les deux boutons etaient habilles a la main : vert plein ecrit en dur pour la
 *       validation, hauteur et taille de texte forcees sur les deux. Aucune variante
 *       sombre, alors que la bascule de theme est dans l'en-tete. Ce sont des boutons de
 *       la bibliotheque, qui suivent le theme sans qu'on le redise.</li>
 *   <li>Le rejet portait `variant="destructive"`, qui n'existe pas en v3 : la prop serait
 *       ignoree en silence et le bouton retomberait sur la variante par defaut. L'operateur
 *       aurait alors deux boutons d'apparence identique pour deux actions opposees. C'est
 *       `danger-soft`.</li>
 *   <li>Pendant la validation d'une ligne, les deux boutons etaient simplement grises. Un
 *       bouton grise sans explication se lit comme une panne : la validation dit son
 *       attente par un Spinner, et le rejet nomme son motif de blocage. Un declencheur
 *       desactive n'emet ni survol ni focus, d'ou le `Tooltip.Trigger` autour du bouton :
 *       sans lui l'info-bulle ne s'ouvrirait jamais, justement quand elle sert.</li>
 * </ul>
 */
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
        fullWidth={fullWidth}
        isPending={isValidating}
        onPress={() => onValidate(ticket.commandeId)}
        size="sm"
        variant="primary"
      >
        {isValidating ? (
          <Spinner color="current" size="sm" />
        ) : (
          <CheckCircle aria-hidden="true" className="size-4" />
        )}
        Valider V2
      </Button>
      <Tooltip>
        <Tooltip.Trigger className={fullWidth ? 'w-full' : undefined}>
          <Button
            fullWidth={fullWidth}
            isDisabled={isValidating}
            onPress={() => onReject(ticket.commandeId)}
            size="sm"
            variant="danger-soft"
          >
            <XCircle aria-hidden="true" className="size-4" />
            Rejeter
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {isValidating ? 'Validation en cours sur ce ticket' : 'Rejeter ce ticket pour fraude'}
        </Tooltip.Content>
      </Tooltip>
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
      // Le nom du partenaire etait en `text-blue-500` sans pendant sombre. La teinte
      // est conservee, la carte mobile la porte aussi, mais avec sa variante sombre.
      cell: ({ row }) => <span className="text-blue-600 dark:text-blue-400">{row.original.restaurant}</span>,
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      enableSorting: false,
      cell: ({ row }) => <span>{formatDate(row.original.date)}</span>,
    },
    /*
     * Chasse tabulaire sur les trois montants : l'operateur parcourt la colonne pour
     * comparer des ordres de grandeur, et des chiffres de largeurs inegales ne
     * s'alignent pas d'une ligne a l'autre.
     */
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
      /*
       * La commission est ce que la course rapporte : meme vert que dans la carte mobile,
       * dans sa declinaison de TEXTE. `text-success-soft-foreground` nu est une couleur de remplissage,
       * mesuree a 2,19 de contraste sur une carte claire, donc sous le seuil de 4,5.
       */
      cell: ({ row }) =>
        row.original.commission != null ? (
          <span className="tabular-nums font-medium text-success-soft-foreground">
            {formatCFA(row.original.commission)}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      accessorKey: 'nomZone',
      header: 'ZONE',
      enableSorting: false,
      /*
       * La pastille de zone etait ecrite en vert clair pose a la main (bordure, fond
       * pastel, texte) sans variante sombre : sur fond sombre elle gardait son fond
       * pastel et devenait illisible. C'est le Chip success de la bibliotheque, celui
       * de la carte mobile : la meme zone se lit pareil sur les deux surfaces.
       */
      cell: ({ row }) => {
        const zone = row.original.nomZone ?? 'VERTE';
        return (
          // Le nom de zone est tronque faute de place : l'info-bulle native donne le nom entier.
          <Chip className="max-w-[160px]" color="success" title={zone} variant="soft">
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
