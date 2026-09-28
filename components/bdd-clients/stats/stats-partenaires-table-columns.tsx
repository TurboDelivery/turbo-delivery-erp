'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';

import { formatFcfa, formatNombre, type IStatPartenaire } from '@/features/bdd-clients';

/**
 * Les colonnes du tableau des partenaires.
 *
 * <h3>Pourquoi une barre sur la part d'exclusifs</h3>
 * <p>Un pourcentage écrit se lit ligne par ligne ; une part se COMPARE d'une ligne à
 * l'autre, et l'œil compare des longueurs bien plus vite que des nombres. C'est la seule
 * proportion du tableau, donc la seule barre.</p>
 *
 * <p>Tous les chiffres sont en chasse tabulaire et alignés à droite : ce tableau se
 * parcourt verticalement, on y cherche « qui apporte le plus ».</p>
 */
export const statsPartenairesColumns: ColumnDef<IStatPartenaire>[] = [
  {
    accessorKey: 'partenaire',
    header: 'Restaurant',
    cell: ({ row }) => (
      <span className="block max-w-[16rem] truncate font-medium text-foreground">
        {row.original.partenaire}
      </span>
    ),
  },
  {
    accessorKey: 'nbClients',
    header: () => <span className="block text-right">Clients</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-foreground">
        {formatNombre(row.original.nbClients)}
      </span>
    ),
  },
  {
    accessorKey: 'partExclusifs',
    header: 'Dont exclusifs',
    cell: ({ row }) => {
      const part = Math.round(row.original.partExclusifs * 100);
      return (
        <div className="flex items-center gap-2">
          {/*
            La barre est OBLIGATOIRE : c'est une proportion, et une proportion se compare
            — l'œil compare des longueurs bien plus vite que des nombres.

            Elle est NEUTRE, pas accent. Cet écran n'appelle aucune action, et quatre
            barres rouges à la suite réclament une attention qu'aucune d'elles ne mérite.
            Le contraste vient de la valeur, pas de la teinte : une barre foncée sur une
            piste claire se compare aussi bien, sans rien prétendre d'urgent.
          */}
          <span
            aria-hidden="true"
            className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-surface-2"
          >
            <span
              className="block h-full rounded-full bg-foreground/70"
              style={{ width: `${part}%` }}
            />
          </span>
          <span className="tabular-nums text-sm text-foreground">
            {formatNombre(row.original.nbExclusifs)}
          </span>
          <span className="tabular-nums text-xs text-muted">{part} %</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'nbCommandes',
    header: () => <span className="block text-right">Commandes</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-foreground">
        {formatNombre(row.original.nbCommandes)}
      </span>
    ),
  },
  {
    accessorKey: 'montant',
    header: () => <span className="block text-right">Montant</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-foreground">
        {row.original.montant > 0 ? formatFcfa(row.original.montant) : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'panierMoyen',
    header: () => <span className="block text-right">Panier moyen</span>,
    cell: ({ row }) => (
      // Nul n'est pas zéro : le montant est facultatif à la saisie, et « 0 FCFA »
      // laisserait croire à des commandes gratuites.
      <span className="block text-right tabular-nums text-muted">
        {row.original.panierMoyen === null ? '—' : formatFcfa(row.original.panierMoyen)}
      </span>
    ),
  },
  {
    // Un bouton explicite plutot qu'un clic sur la ligne : react-aria donne deja aux
    // lignes un role de navigation au clavier, et y greffer une action ouvrirait le
    // detail par accident en parcourant le tableau aux fleches.
    cell: ({ row, table }) => (
      <button
        aria-label={`Voir où vont aussi les clients de ${row.original.partenaire}`}
        className="rounded-medium p-1 text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent"
        onClick={() =>
          (table.options.meta as MetaStatsPartenaires | undefined)?.onOuvrir(
            row.original.partenaireId,
            row.original.partenaire,
          )
        }
        type="button"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    ),
    header: '',
    id: 'ouvrir',
  },
];

/**
 * Ce que le tableau sait faire, passe par `meta`.
 *
 * <p>Une colonne ne peut pas capturer une fonction du composant sans etre redefinie a
 * chaque rendu, ce qui reconstruirait la table entiere.</p>
 */
export interface MetaStatsPartenaires {
  onOuvrir: (id: string, nom: string) => void;
}
