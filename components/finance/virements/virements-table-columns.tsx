'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button, Chip } from '@heroui-v3/react';
import { Ban, Paperclip } from 'lucide-react';

import { formatFcfa } from '@/features/encours';
import { formatDateFr } from '@/lib/date-utils';
import { IVirementRecu } from '@/features/virements';

/**
 * Les colonnes du journal des virements.
 *
 * <p>L'ordre et les intitulés reprennent ceux de l'Annexe 2 du relevé (spécification du
 * 05/11/2026) : date d'opération, date de valeur, référence, libellé, montant. Un
 * opérateur qui saisit ici et un partenaire qui lit le relevé doivent voir la même
 * chose dans le même ordre, sinon le rapprochement se fait de tête.</p>
 *
 * <p>Le PRÉLÈVEMENT n'est pas une colonne : il dépend du taux de la sélection, pas du
 * virement. Il appartient au relevé, et l'afficher ici laisserait croire qu'il est
 * stocké.</p>
 *
 * <p>Le PAYEUR non plus : l'écran n'affiche jamais que les virements d'un seul payeur,
 * déjà nommé au-dessus. La colonne répétait la même valeur à chaque ligne et, sur une
 * largeur contrainte, elle poussait les montants à se casser sur trois lignes — ce qui
 * ruine l'alignement en chasse tabulaire. Vu au banc.</p>
 */
export function colonnesVirements(
  onAnnuler: (virement: IVirementRecu) => void,
  peutAnnuler: boolean,
): ColumnDef<IVirementRecu>[] {
  return [
    {
      accessorKey: 'dateOperation',
      header: 'Date opération',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{formatDateFr(row.original.dateOperation)}</span>
      ),
    },
    {
      accessorKey: 'dateValeur',
      header: 'Date valeur',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted">
          {formatDateFr(row.original.dateValeur)}
        </span>
      ),
    },
    {
      accessorKey: 'reference',
      header: 'Référence',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference}</span>,
    },
    {
      accessorKey: 'libelle',
      header: 'Libellé',
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-[18rem]" title={row.original.libelle}>
          {row.original.libelle}
        </span>
      ),
    },
    {
      accessorKey: 'montant',
      header: () => <span className="block whitespace-nowrap text-right">Montant reçu</span>,
      cell: ({ row }) => (
        // Chasse tabulaire et alignement à droite : des montants se comparent du regard,
        // colonne par colonne, et c'est impossible en chasse proportionnelle.
        <span className="block whitespace-nowrap text-right font-mono tabular-nums">
          {formatFcfa(row.original.montant)}
        </span>
      ),
    },
    {
      id: 'justificatif',
      header: 'Justif.',
      cell: ({ row }) =>
        row.original.justificatifUrl ? (
          <a
            className="inline-flex items-center gap-1 text-xs underline"
            href={row.original.justificatifUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Paperclip aria-hidden="true" className="size-3.5" />
            Voir
          </a>
        ) : (
          // Un tiret dit « rien ici », un vide laisse croire à un défaut d'affichage.
          <span className="text-muted">—</span>
        ),
    },
    {
      id: 'etat',
      header: 'État',
      cell: ({ row }) =>
        row.original.annule ? (
          // Le motif est porté par l'info-bulle native : une annulation sans sa raison
          // oblige a rouvrir le journal d'audit pour comprendre.
          <span title={row.original.annuleMotif ?? undefined}>
            <Chip color="danger" size="sm" variant="soft">
              <Chip.Label>Annulé</Chip.Label>
            </Chip>
          </span>
        ) : (
          <Chip color="success" size="sm" variant="soft">
            <Chip.Label>Reçu</Chip.Label>
          </Chip>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.annule || !peutAnnuler ? null : (
          <Button
            className="whitespace-nowrap"
            onPress={() => onAnnuler(row.original)}
            size="sm"
            variant="outline"
          >
            <Ban aria-hidden="true" className="size-4" />
            Annuler
          </Button>
        ),
    },
  ];
}
