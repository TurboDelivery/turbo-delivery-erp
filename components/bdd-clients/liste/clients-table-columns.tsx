'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Store, Users } from 'lucide-react';

import {
  LIBELLES_CONSENTEMENT,
  LIBELLES_SEGMENT,
  LIBELLES_STATUT,
  formatFcfa,
  formatJour,
  formatNombre,
  type ILigneClient,
} from '@/features/bdd-clients';

/**
 * Les colonnes de la base clients.
 *
 * <h3>Ce que la couleur dit ici</h3>
 * <p>Presque rien, et c'est voulu. Une base de contacts n'a pas d'état qui appelle une
 * action urgente : un client « à qualifier » attend un appel, il n'est pas en faute.
 * Seules deux teintes existent — l'accent discret du badge « fidèle », qui est
 * l'information commerciale de cet écran, et le gris de tout le reste. Peindre chaque
 * statut d'une couleur différente ferait cinq teintes qui ne diraient rien.</p>
 *
 * <h3>Les chiffres se comparent</h3>
 * <p>Captures, restaurants et montant sont en chasse tabulaire et alignés à droite : ce
 * sont les trois colonnes qu'on parcourt verticalement pour repérer un client qui sort
 * du lot.</p>
 */

/** Un client capturé deux fois ou plus est un fidèle : c'est ce que la base sert à voir. */
function Fidelite({ ligne }: { ligne: ILigneClient }) {
  if (ligne.nbCaptures < 2) {
    return <span className="tabular-nums text-muted">{ligne.nbCaptures}</span>;
  }
  // ⚠ Pas d'accent ici. Sur ce thème l'accent est le ROUGE de la marque, qui est aussi
  // la couleur du danger : un client fidèle se serait affiché comme une alerte. Le badge
  // se distingue par sa FORME et par le gras du nombre, pas par une teinte. C'est la
  // règle du dépôt, la couleur dit quelque chose ou elle n'existe pas.
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-foreground"
      title={`Ce contact est revenu ${ligne.nbCaptures} fois`}
    >
      <span className="tabular-nums">{ligne.nbCaptures}</span>
      <Users aria-hidden="true" className="size-3 text-muted" />
    </span>
  );
}

export const clientsColumns: ColumnDef<ILigneClient>[] = [
  {
    accessorKey: 'position',
    cell: ({ row }) => (
      <span className="tabular-nums text-xs text-muted">{formatNombre(row.original.position)}</span>
    ),
    header: 'N°',
  },
  {
    accessorKey: 'nom',
    cell: ({ row }) => {
      const l = row.original;
      const nom = [l.nom, l.prenom].filter(Boolean).join(' ').trim();
      return (
        <div className="min-w-0">
          {/* Une fiche sans nom se saisit et se complète plus tard : elle ne se cache pas. */}
          <span className={nom ? 'font-medium text-foreground' : 'italic text-muted'}>
            {nom || 'Sans nom'}
          </span>
          {l.alias.length > 0 ? (
            <span className="block truncate text-xs text-muted" title={l.alias.join(' · ')}>
              aussi : {l.alias.join(' · ')}
            </span>
          ) : null}
        </div>
      );
    },
    header: 'Client',
  },
  {
    accessorKey: 'telephone',
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums text-foreground">
        {row.original.telephone}
      </span>
    ),
    header: 'Contact',
  },
  {
    accessorKey: 'nbCaptures',
    cell: ({ row }) => <Fidelite ligne={row.original} />,
    header: 'Captures',
  },
  {
    accessorKey: 'nbPartenaires',
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 tabular-nums text-muted">
        <Store aria-hidden="true" className="size-3.5" />
        {row.original.nbPartenaires}
      </span>
    ),
    header: 'Restaurants',
  },
  {
    accessorKey: 'derniereCaptureAt',
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums text-muted">
        {formatJour(row.original.derniereCaptureAt)}
      </span>
    ),
    header: 'Dernière',
  },
  {
    accessorKey: 'segment',
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted">
        {row.original.segment ? LIBELLES_SEGMENT[row.original.segment] ?? row.original.segment : '—'}
      </span>
    ),
    header: 'Segment',
  },
  {
    accessorKey: 'statut',
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted">
        {LIBELLES_STATUT[row.original.statut] ?? row.original.statut}
      </span>
    ),
    header: 'Statut',
  },
  {
    accessorKey: 'consentement',
    cell: ({ row }) => {
      const c = row.original.consentement;
      // `whitespace-nowrap` : « Non renseigné » passait à la ligne et doublait la hauteur
      // de trois rangées sur sept. Mesuré à l'écran. Le tableau défile déjà.
      return (
        <span className={`whitespace-nowrap ${c === 'OUI' ? 'text-foreground' : 'text-muted'}`}>
          {c ? LIBELLES_CONSENTEMENT[c] ?? c : LIBELLES_CONSENTEMENT.NON_RENSEIGNE}
        </span>
      );
    },
    header: 'Consentement',
  },
  {
    accessorKey: 'montantCumule',
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums text-muted">
        {row.original.montantCumule > 0 ? formatFcfa(row.original.montantCumule) : '—'}
      </span>
    ),
    header: 'Cumulé',
  },
];

/** Le compte de colonnes vient de la LISTE, jamais d'un nombre écrit à la main. */
export const NB_COLONNES_CLIENTS = clientsColumns.length;
