import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ColumnDef } from '@tanstack/react-table';
import { buttonVariants } from '@heroui-v3/styles';
import type { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { getLotStatutConfig } from '../utils/lot-statut.utils';
import CreneauActifToggleCell from './CreneauActifToggleCell';

export function fmtDate(iso: string | null) {
  if (!iso) return '';
  try { return format(parseISO(iso), 'd MMM yyyy', { locale: fr }); } catch { return iso; }
}

/*
 * Les colonnes portent toutes un `id` explicite. HistoriqueCreneauxContent cle les
 * cellules de ses lignes de chargement sur `col.id` ; cinq colonnes n'en declaraient
 * pas, et React recevait cinq fois la cle "undefined" sur la meme ligne de squelette.
 * La valeur reprend a l'identique celle que TanStack derivait de `accessorKey`, le tri
 * et l'ordre des colonnes sont donc inchanges.
 */
export const historiqueCreneauxColumns: ColumnDef<ICreneauActifVm>[] = [
  {
    id: 'label',
    accessorKey: 'label',
    header: 'Créneau',
    cell: ({ row }) => (
      <span className="font-semibold text-foreground text-sm whitespace-nowrap">{row.original.label}</span>
    ),
  },
  {
    id: 'periode',
    header: 'Période',
    cell: ({ row }) => (
      <span className="text-sm text-muted whitespace-nowrap">
        {fmtDate(row.original.dateDebut)} → {fmtDate(row.original.dateFin)}
      </span>
    ),
  },
  {
    id: 'nbLivreurs',
    accessorKey: 'nbLivreurs',
    header: 'Livreurs',
    /* Chasse proportionnelle : les effectifs d'une ligne a l'autre ne s'alignaient pas,
       et comparer deux creneaux d'un coup d'oeil demandait de lire chiffre par chiffre. */
    cell: ({ row }) => <span className="text-sm tabular-nums text-foreground">{row.original.nbLivreurs}</span>,
  },
  {
    id: 'totalTickets',
    accessorKey: 'totalTickets',
    header: 'Tickets',
    cell: ({ row }) => <span className="text-sm tabular-nums text-foreground">{row.original.totalTickets}</span>,
  },
  {
    id: 'nbTicketsPending',
    accessorKey: 'nbTicketsPending',
    header: 'En attente',
    cell: ({ row }) => (
      /*
       * `text-amber-600` etait ecrit en dur, sans variante sombre : depuis que la bascule
       * de theme est dans l'en-tete, le seul chiffre de la ligne qui reclame un traitement
       * restait ambre clair sur fond fonce. `text-warning-soft-foreground` porte le meme
       * sens et suit les deux themes ; la carte mobile equivalente, dans
       * HistoriqueCreneauxContent, affiche deja ce compteur ainsi.
       */
      <span className={`text-sm font-medium tabular-nums ${row.original.nbTicketsPending > 0 ? 'text-warning-soft-foreground' : 'text-muted'}`}>
        {row.original.nbTicketsPending}
      </span>
    ),
  },
  {
    id: 'totalNet',
    accessorKey: 'totalNet',
    header: 'Net (FCFA)',
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
        {formatCFA(row.original.totalNet)}
      </span>
    ),
  },
  {
    id: 'soumisLe',
    header: 'Soumis le',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-foreground whitespace-nowrap">{fmtDate(row.original.soumisAt)}</span>
        {row.original.soumisParNom && (
          <span className="text-xs text-muted">par {row.original.soumisParNom}</span>
        )}
      </div>
    ),
  },
  {
    id: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const config = getLotStatutConfig(row.original.lotStatut);
      return (
        <div className="flex flex-col gap-1.5">
          {/* La pastille garde ses huit teintes : la chaine de validation d'un lot compte
              huit etats et l'echelle d'etat du theme n'en offre que trois. Les couples
              clair/sombre viennent de `lot-statut.utils`, et le LIBELLE reste ecrit, la
              couleur ne portant jamais seule l'information. */}
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold w-fit ${config.className}`}>
            {config.label}
          </span>
          {row.original.commentaireRejet && (
            /* Le motif de rejet est coupe a deux lignes. Sans le texte complet au survol,
               savoir POURQUOI un lot a ete refuse imposait d'ouvrir la page de detail. */
            <p className="text-xs text-muted max-w-[220px] line-clamp-2" title={row.original.commentaireRejet}>
              {row.original.commentaireRejet}
            </p>
          )}
        </div>
      );
    },
  },
  {
    // V59 (2026-05-29) — Bascule de visibilité (drapeau actif). Remplace
    // l'ancienne modale "Gérer les créneaux" de la grille de paiement.
    id: 'actif',
    header: 'Visible',
    cell: ({ row }) => <CreneauActifToggleCell creneau={row.original} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      /*
       * Le lien de detail etait peint a la main en `text-red-500`, avec un `hover:` en
       * `red-600` et un chevron typographique pour toute cible. Deux consequences : la
       * teinte etait la meme dans les deux themes alors que le theme, lui, change ; et
       * sur la surface claire du tableau ce rouge rend environ 3,8 pour un seuil de 4,5,
       * seul le survol repassant au-dessus. Autrement dit le seul chemin vers le detail
       * d'un creneau se lisait le moins bien au repos. `buttonVariants` est la facon
       * documentee d'habiller un lien de routage avec les styles V3 : la navigation reste
       * celle de Next, l'apparence et la zone de clic viennent du theme. Meme choix que
       * la carte mobile equivalente dans HistoriqueCreneauxContent.
       */
      <Link
        className={buttonVariants({ size: 'sm', variant: 'ghost' })}
        href={`/validation-tickets/historique-creneaux/${row.original.id}`}
      >
        Détail
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    ),
  },
];
