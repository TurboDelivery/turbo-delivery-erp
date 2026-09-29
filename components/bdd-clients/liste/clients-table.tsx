'use client';

import React from 'react';

import { Button, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';

import { ActionsGroupeesBarre } from './actions-groupees-barre';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { formatNombre, useClientsTable } from '@/features/bdd-clients';

import { NB_COLONNES_CLIENTS } from './clients-table-columns';

/**
 * La base clients, une ligne par client.
 *
 * <p>Un `Table` HeroUI v3, contrairement à la grille de saisie : ici on LIT, on ne tape
 * pas. Rien ne dispute le clavier à react-aria, donc la règle du dépôt s'applique sans
 * exception.</p>
 *
 * <p>⚠ Le squelette dérive son nombre de cellules de la liste des colonnes. Un nombre
 * écrit à la main qui diverge fait lever « Cell count must match column count » à react
 * aria, et la page entière tombe en 500.</p>
 */
export function ClientsTable({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const {
    allerA,
    aUnFiltre,
    isError,
    isFetching,
    isLoading,
    page,
    refetch,
    selectionnes,
    table,
    total,
    totalPages,
    viderLaSelection,
  } = useClientsTable(onOuvrir);

  /*
   * ⚠ La barre d'actions se rend ICI, pas dans la vue.
   *
   * Premiere version : la selection etait remontee a la vue par deux `useEffect`. Le
   * tableau des identifiants et la fonction de vidage etaient recrees a chaque rendu,
   * donc chaque effet en declenchait un autre — React error #185, « Maximum update
   * depth exceeded », page entiere en 500. Le build etait vert et tsc muet.
   *
   * La selection vit dans ce composant : la barre qui la lit y vit aussi. Rien a
   * remonter, rien a synchroniser.
   */

  if (isError) {
    return <EtatErreur enCours={isFetching} onReessayer={() => void refetch()} quoi="la base clients" />;
  }

  const lignes = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      <ActionsGroupeesBarre onFini={viderLaSelection} selectionnes={selectionnes} />

      <Table>
      <Table.ScrollContainer className="rounded-xl border border-separator">
        <Table.Content aria-label="Base de données clients" className="min-w-[68rem]">
          <Table.Header>
            {table.getFlatHeaders().map((h, i) => (
              <Table.Column id={h.id} isRowHeader={i === 0} key={h.id}>
                {flexRender(h.column.columnDef.header, h.getContext())}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() =>
              isLoading ? null : (
                <div className="flex flex-col items-center gap-1 py-10 text-center">
                  <p className="text-sm text-foreground">
                    {aUnFiltre
                      ? 'Aucun client ne correspond à ces filtres.'
                      : 'La base ne contient encore aucune fiche.'}
                  </p>
                  <p className="text-xs text-muted">
                    {aUnFiltre
                      ? 'Élargis la période ou retire un critère.'
                      : 'Elle se remplit par la saisie en lot et par l’import d’un fichier.'}
                  </p>
                </div>
              )
            }
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Table.Row id={`squelette-${i}`} key={`squelette-${i}`}>
                    {Array.from({ length: NB_COLONNES_CLIENTS }).map((__, j) => (
                      <Table.Cell key={j}>
                        <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : lignes.map((row) => (
                  <Table.Row id={row.id} key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>

      {/* Le pied est FRÈRE du conteneur de défilement, hors de Table.Content : dedans, il
          ne rend rien, et sans erreur. */}
      <Table.Footer className="justify-between text-sm">
        <span className="text-muted">
          <span className="font-semibold tabular-nums text-foreground">{formatNombre(total)}</span>{' '}
          client{total > 1 ? 's' : ''}
        </span>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              isDisabled={page <= 0 || isFetching}
              isIconOnly
              aria-label="Page précédente"
              onPress={() => allerA(page - 1)}
              size="sm"
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <span className="tabular-nums text-muted">
              {page + 1} / {totalPages}
            </span>
            <Button
              isDisabled={page + 1 >= totalPages || isFetching}
              isIconOnly
              aria-label="Page suivante"
              onPress={() => allerA(page + 1)}
              size="sm"
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ) : null}
      </Table.Footer>
      </Table>
    </div>
  );
}
