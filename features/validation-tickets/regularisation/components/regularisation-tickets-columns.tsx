'use client';

/*
 * Colonnes, pastille de statut et actions du tableau de regularisation, en HeroUI V3.
 *
 * <h3>Ce qui n'allait pas</h3>
 * <ul>
 *   <li>Les trois boutons (Authentifier, Rejeter, Approuver) venaient du Button maison et
 *       portaient leurs couleurs ecrites en dur: vert plein, rouge plein, bordure rouge,
 *       plus une hauteur et une taille de texte forcees. Aucune variante sombre, alors que
 *       la bascule de theme est dans l'en-tete: ces aplats restaient clairs sur fond
 *       fonce. Ce sont des boutons de la bibliotheque, qui suivent le theme sans qu'on le
 *       redise.</li>
 *   <li>Approuver et Rejeter etaient tous deux rouges: deux actions opposees d'apparence
 *       presque identique, sur un ecran ou l'une valide le retard et l'autre classe le
 *       ticket en fraude. L'accent va desormais a ce qui approuve, le rouge a ce qui
 *       rejette.</li>
 *   <li>Pendant une approbation, les deux boutons etaient grises sans rien dire. Un bouton
 *       grise muet se lit comme une panne: l'attente est desormais portee par le bouton
 *       lui-meme (Spinner), et le motif de blocage se lit dans l'info-bulle. Un
 *       declencheur desactive n'emet ni survol ni focus, d'ou le `Tooltip.Trigger` autour
 *       de chaque bouton: sans lui l'info-bulle ne s'ouvrirait jamais, justement quand
 *       elle sert.</li>
 *   <li>La pastille de statut etait un span habille a la main, en `bg-*-100 text-*-700`
 *       sans variante sombre: sous le theme sombre le statut sortait en pastel clair sur
 *       fond fonce, illisible. Les six teintes restent des couleurs Tailwind (six statuts
 *       a distinguer, l'echelle du theme n'en propose pas autant) mais avec leur pendant
 *       sombre, et alignees sur celles de la carte mobile pour que les deux vues du meme
 *       ticket ne divergent pas. La couleur ne porte jamais seule le sens: le libelle
 *       reste ecrit.</li>
 *   <li>Le cout de livraison etait en `text-orange-500` sans variante sombre, et les
 *       montants en chasse proportionnelle: deux montants de meme longueur ne s'alignaient
 *       pas d'une ligne a l'autre, et un chiffre en trop passait inapercu.</li>
 * </ul>
 *
 * <p>Ce qui ne change pas: les memes colonnes, les memes montants, les memes actions par
 * statut, le meme marqueur « Authentifié » sur un ticket deja authentifie, et le meme
 * tiret quand un statut n'appelle aucune action.</p>
 */

import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, ShieldCheck, X } from 'lucide-react';
import { Button, Chip, Spinner, Tooltip } from '@heroui-v3/react';
import { cn } from '@/lib/utils';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';
import { formatMontant } from '@/utils/format.utils';

export interface RegularisationTicketsColumnMeta {
  onApprove: (id: string) => void;
  onReject: (ticket: BonLivraisonTerminee) => void;
  onAuthentifier: (id: string) => void;
  approvingId: string | null;
  isApproving: boolean;
  authenticatedIds: Set<string>;
}

/** Libellé + teinte de la pastille par statut (dupliqué localement — voir ticket-table-columns). */
const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  [StatutControle.PENDING]: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300',
  },
  [StatutControle.TARDIF]: {
    label: 'Tardif',
    className: 'bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-300',
  },
  [StatutControle.AUTHENTIFIE]: {
    label: 'Authentifié',
    className: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300',
  },
  [StatutControle.V1_VALIDE]: {
    label: 'V1 Validé',
    className: 'bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300',
  },
  [StatutControle.V2_VALIDE]: {
    label: 'V2 Validé',
    className: 'bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300',
  },
  [StatutControle.REJETE_FRAUDE]: {
    label: 'Rejeté (Fraude)',
    className: 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-300',
  },
};

/**
 * Config (libellé + teinte de la pastille) du statut effectif d'un ticket. Tient
 * compte de l'authentification optimiste (PENDING + id authentifié → AUTHENTIFIE).
 * Partagé entre la colonne « Statut » du tableau et la carte mobile.
 */
export function getRegularisationStatutConfig(
  ticket: BonLivraisonTerminee,
  authenticatedIds: Set<string>,
) {
  const rawStatut = ticket.statutControle ?? ticket.statut;
  const statut =
    rawStatut === StatutControle.PENDING && authenticatedIds.has(ticket.commandeId)
      ? StatutControle.AUTHENTIFIE
      : rawStatut;
  // Un statut inconnu du backend garde une pastille neutre et son libellé brut: il ne
  // disparait pas de l'écran sous prétexte qu'aucune teinte ne lui est prévue.
  return STATUT_CONFIG[statut] ?? { label: statut, className: 'bg-surface-tertiary text-foreground' };
}

/**
 * Actions disponibles pour un ticket selon son statut (authentifier / approuver
 * / rejeter / aucune). Partagé entre la cellule « Actions » du tableau et la
 * carte mobile (zéro divergence de logique). {@code fullWidth} étire les boutons
 * pour l'affichage carte mobile.
 */
export function renderRegularisationActions(
  ticket: BonLivraisonTerminee,
  meta: RegularisationTicketsColumnMeta,
  fullWidth = false,
) {
  const statut = ticket.statutControle ?? ticket.statut;

  // PENDING → authentification (déjà fait = aucune action).
  if (statut === StatutControle.PENDING) {
    if (meta.authenticatedIds.has(ticket.commandeId)) {
      return (
        <div className="flex items-center justify-end gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          Authentifié
        </div>
      );
    }
    return (
      <div className={cn('flex items-center', !fullWidth && 'justify-end')}>
        <Button
          fullWidth={fullWidth}
          onPress={() => meta.onAuthentifier(ticket.commandeId)}
          size="sm"
          variant="primary"
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          Authentifier
        </Button>
      </div>
    );
  }

  // TARDIF → approuver (retard) ou rejeter (fraude).
  if (statut === StatutControle.TARDIF) {
    const isApprovingThis = meta.isApproving && meta.approvingId === ticket.commandeId;
    return (
      <div className={cn('flex items-center gap-2', !fullWidth && 'justify-end')}>
        <Tooltip>
          {/* Le declencheur porte l'etirement de la carte mobile: un bouton `fullWidth`
              dans un declencheur qui ne s'etire pas resterait a sa largeur de texte. */}
          <Tooltip.Trigger className={fullWidth ? 'flex-1' : undefined}>
            <Button
              fullWidth={fullWidth}
              isDisabled={meta.isApproving}
              onPress={() => meta.onReject(ticket)}
              size="sm"
              variant="danger-soft"
            >
              <X aria-hidden="true" className="size-4" />
              Rejeter
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            {meta.isApproving
              ? 'Une approbation est en cours, patientez'
              : 'Rejeter ce ticket pour fraude'}
          </Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger className={fullWidth ? 'flex-1' : undefined}>
            <Button
              fullWidth={fullWidth}
              isDisabled={meta.isApproving}
              isPending={isApprovingThis}
              onPress={() => meta.onApprove(ticket.commandeId)}
              size="sm"
              variant="primary"
            >
              {isApprovingThis ? (
                <Spinner color="current" size="sm" />
              ) : (
                <ShieldCheck aria-hidden="true" className="size-4" />
              )}
              Approuver
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            {isApprovingThis
              ? 'Approbation de ce ticket en cours'
              : meta.isApproving
                ? 'Une approbation est en cours sur un autre ticket'
                : 'Approuver ce ticket tardif'}
          </Tooltip.Content>
        </Tooltip>
      </div>
    );
  }

  // AUTHENTIFIE / V1_VALIDE / V2_VALIDE / REJETE_FRAUDE → aucune action.
  return null;
}

/** Statuts proposés dans le filtre (tous sauf TARDIF). PENDING est le défaut. */
export const STATUT_FILTER_OPTIONS: { value: StatutControle; label: string }[] = [
  { value: StatutControle.PENDING, label: 'En attente' },
  { value: StatutControle.AUTHENTIFIE, label: 'Authentifié' },
  { value: StatutControle.V1_VALIDE, label: 'V1 Validé' },
  { value: StatutControle.V2_VALIDE, label: 'V2 Validé' },
  { value: StatutControle.REJETE_FRAUDE, label: 'Rejeté (Fraude)' },
];

export function createRegularisationTicketsColumns(): ColumnDef<BonLivraisonTerminee>[] {
  return [
    {
      accessorKey: 'reference',
      header: 'Référence',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">{row.original.reference}</span>
      ),
    },
    {
      accessorKey: 'livreur',
      header: 'Livreur',
      cell: ({ row }) => <span className="text-sm text-foreground">{row.original.livreur}</span>,
    },
    {
      accessorKey: 'restaurant',
      header: 'Restaurant',
      cell: ({ row }) => <span className="text-sm text-foreground">{row.original.restaurant}</span>,
    },
    {
      accessorKey: 'coutCommande',
      header: () => <div className="w-full text-right">Montant CMD</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums text-foreground">
          {formatMontant(row.original.coutCommande)}
        </div>
      ),
    },
    {
      accessorKey: 'coutLivraison',
      header: () => <div className="w-full text-right">Coût livraison</div>,
      cell: ({ row }) => (
        // Le cout de livraison est ce que la regularisation met en jeu: il garde sa
        // teinte, avec la variante sombre qui lui manquait. La carte mobile equivalente,
        // dans RegularisationTicketsTable, affiche deja ce montant ainsi.
        <div className="text-right text-sm font-medium tabular-nums text-orange-600 dark:text-orange-400">
          {formatMontant(row.original.coutLivraison)}
        </div>
      ),
    },
    {
      id: 'dateHeure',
      header: 'Date / Heure',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{row.original.date}</span>
          <span className="text-xs text-muted">{row.original.heure}</span>
        </div>
      ),
    },
    {
      id: 'statut',
      header: 'Statut',
      cell: ({ row, table }) => {
        const meta = table.options.meta as RegularisationTicketsColumnMeta;
        const config = getRegularisationStatutConfig(row.original, meta.authenticatedIds);
        return (
          <Chip className={config.className} size="sm" variant="soft">
            {config.label}
          </Chip>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="w-full text-right">Actions</div>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as RegularisationTicketsColumnMeta;
        return (
          renderRegularisationActions(row.original, meta) ?? (
            <div className="text-right text-xs text-muted">—</div>
          )
        );
      },
    },
  ];
}
