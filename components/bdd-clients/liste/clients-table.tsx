'use client';

import { Button, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
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
  const { allerA, isError, isFetching, isLoading, page, refetch, table, total, totalPages } =
    useClientsTable(onOuvrir);

  if (isError) {
    return <EtatErreur enCours={isFetching} onReessayer={() => void refetch()} quoi="la base clients" />;
  }

  const lignes = table.getRowModel().rows;

  return (
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
                <p className="py-10 text-center text-sm text-muted">
                  Aucun client ne correspond à ces filtres.
                </p>
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
  );
}
