'use client';

import React from 'react';
import { useRecouvrementTable } from '@/features/recouvrements/hooks/use-recouvrement-table';
import { Card, Table } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { PaginationTableau } from '../common/pagination-tableau';
import { flexRender } from '@tanstack/react-table';
import { RestaurantSelect } from '../common/restaurant-select';
import { CreerRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/creer-recouvrement-modal';
import { RecouvrementMobileCard } from '@/components/finance/recouvrements/recouvrement-mobile-cards';
import EtatErreur from '@/components/commons/EtatErreur';

interface RecouvrementTableProps {
  restoOpts: Array<{ value: string; label: string }>;
  isOptionsLoading?: boolean;
}

export function RecouvrementTable({ restoOpts, isOptionsLoading }: RecouvrementTableProps) {
  const { table, isLoading, isError, isFetching, refetch, filters, setFilters, pagination, colsCount } = useRecouvrementTable();

  // meme bloc pour les deux rendus (tableau desktop, cartes mobiles) : un seul est visible a la fois
  const zoneErreur = <EtatErreur quoi="les recouvrements" onReessayer={() => refetch()} enCours={isFetching} />;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <RestaurantSelect
          value={filters.restaurantId}
          onChange={(value) => setFilters({ restaurantId: value || '', page: 0 })}
          options={restoOpts}
          isLoading={isOptionsLoading}
          placeholder="Tous les restaurants"
          className="w-full sm:w-[280px]"
        />
        <CreerRecouvrementModal variant="ghost" />
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Recouvrements" className="min-w-[48rem]">
                <Table.Header>
                  {table.getFlatHeaders().map((header, i) => (
                    <Table.Column
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader={i === 0}
                      key={header.id}
                    >
                      {({ sortDirection }) =>
                        header.column.getCanSort() ? (
                          <Table.SortableColumnHeader sortDirection={sortDirection}>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.SortableColumnHeader>
                        ) : (
                          <>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </>
                        )
                      }
                    </Table.Column>
                  ))}
                </Table.Header>

                {/* sur echec, l'erreur prend la place du message "Aucun recouvrement" qui se
                    lirait comme un resultat vide */}
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : isError ? (
                      <div className="py-6">{zoneErreur}</div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucun recouvrement</p>
                    )
                  }
                >
                  {isLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {table.getFlatHeaders().map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading || isError ? [] : table.getRowModel().rows).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell className={cn(isFetching && 'opacity-70')} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {pagination && pagination.pageCount > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau
                  onPage={pagination.handlePageChange}
                  page={pagination.page + 1}
                  total={pagination.pageCount}
                />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className={`md:hidden space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-28 rounded-xl bg-surface-secondary animate-pulse" />)
        ) : isError ? (
          zoneErreur
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">Aucun recouvrement</p>
        ) : (
          table.getRowModel().rows.map((row) => <RecouvrementMobileCard key={row.id} recouvrement={row.original} />)
        )}
      </div>

      {/* La pagination du tableau est dans son pied ; celle-ci sert aux cartes. */}
      <div className="flex justify-center pt-2 md:hidden">
        <PaginationTableau
          onPage={pagination?.handlePageChange ?? (() => undefined)}
          page={(pagination?.page ?? 0) + 1}
          total={pagination?.pageCount ?? 0}
        />
      </div>
    </div>
  );
}
