import { Checkbox, Chip } from '@heroui-v3/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Mail, MapPin } from 'lucide-react';
import React from 'react';

import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { type Restaurant } from '@/types/models';

import { AvatarCell } from './avatar-cell';
import { StatusChip } from './status-chip';
import { TurboyActionMenu } from './turboy-action-menu';

/** L'affectation d'un coursier : quatre états, un seul en dit assez pour porter un ton. */
const ASSIGNATION: Record<string, { couleur: 'default' | 'success' | 'warning'; libelle: string }> = {
  FREE: { couleur: 'default', libelle: 'Bird / Libre' },
  TURBO: { couleur: 'success', libelle: 'Assigné' },
  WAITING: { couleur: 'warning', libelle: 'En attente' },
};

/**
 * Les colonnes du tableau des coursiers.
 *
 * <h3>Ce qui disparaît, et pourquoi</h3>
 * <p>La colonne « PROPRIÉTAIRE ». Elle affichait la chaîne « Peut être utilisé partout »
 * sur CHAQUE ligne, sans jamais lire la moindre donnée : une colonne qui répète le même
 * texte cent fois n'informe de rien et prend la place d'une qui informerait.</p>
 *
 * <p>Le type de contrat perd sa couleur. C'est une étiquette de catégorie, pas un état :
 * trois teintes de plus sur un écran où la couleur doit dire l'état du compte et
 * l'affectation.</p>
 */
export function getMenColumns(restaurants: Restaurant[]): ColumnDef<ITurboy>[] {
  return [
    {
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Sélectionner ${row.original.prenoms} ${row.original.nom}`}
          isSelected={row.getIsSelected()}
          onChange={(checked) => row.toggleSelected(checked)}
          /*
           * `slot={null}` : a l'interieur d'un `Table`, la v3 branche tout `Checkbox` sur
           * le contexte de selection de la table et exige `slot="selection"`, faute de
           * quoi elle leve « A slot prop is required » — et la page tombe en 500. Ici la
           * selection est celle de TanStack, sur laquelle reposent les actions groupees
           * et la fusion : on sort donc du contexte au lieu de changer de modele.
           */
          slot={null}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      ),
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Tout sélectionner"
          isIndeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          isSelected={table.getIsAllPageRowsSelected()}
          onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          slot={null}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      ),
      id: 'select',
      size: 40,
    },
    {
      accessorKey: 'prenoms',
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex min-w-[200px] items-center gap-3">
            <AvatarCell turboy={t} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {t.prenoms} {t.nom}
              </span>
              <span className="flex items-center gap-1 truncate text-xs text-muted">
                <Mail aria-hidden="true" className="size-3 shrink-0" />
                {t.email ?? '-'}
              </span>
            </div>
          </div>
        );
      },
      header: 'Coursier',
    },
    {
      accessorKey: 'commission',
      cell: ({ row }) => (
        <span className="block text-right text-sm tabular-nums text-foreground">
          {row.original.commission != null ? `${row.original.commission}%` : '--'}
        </span>
      ),
      header: 'Commission',
    },
    {
      accessorKey: 'typeLivreur',
      cell: ({ row }) => {
        // V54 (2026-05-29) — Passage par le helper centralisé pour gérer les
        // 3 types (INDEPENDANT, JOURNALIER, SUPERVISEUR_LIVREUR) + fallback
        // "À catégoriser" sur valeur inconnue. Avant : un ternaire à 2
        // branches affichait "Journalier" pour tout ce qui n'était pas
        // INDEPENDANT — ce qui faisait passer un superviseur-livreur pour
        // un journalier dans la liste filtrée.
        const display = getTurboyTypeDisplay(row.original.typeLivreur);
        return (
          <Chip size="sm" variant="soft">
            <Chip.Label>{display.label}</Chip.Label>
          </Chip>
        );
      },
      header: 'Type de livreur',
    },
    {
      accessorKey: 'habitation',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{row.original.habitation ?? '-'}</span>
        </div>
      ),
      header: 'Domicilié',
    },
    {
      cell: ({ row }) => {
        const a = ASSIGNATION[row.original.type ?? ''];
        return (
          <Chip color={a?.couleur ?? 'default'} size="sm" variant="soft">
            <Chip.Label>{a?.libelle ?? 'Non assigné'}</Chip.Label>
          </Chip>
        );
      },
      header: 'Assignation',
      id: 'assignation',
    },
    {
      accessorKey: 'status',
      cell: ({ row }) => <StatusChip status={row.original.status} />,
      header: 'État du compte',
    },
    {
      cell: ({ row }) => (
        <div className="flex justify-end">
          <TurboyActionMenu restaurants={restaurants} turboy={row.original} />
        </div>
      ),
      header: '',
      id: 'actions',
    },
  ];
}
