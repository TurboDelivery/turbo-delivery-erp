'use client';

import { Card, ComboBox, Input, ListBox, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { RestaurantRecouvrementMobileCard } from '@/components/finance/recouvrements/recouvrement-mobile-cards';
import useRestaurantRecouvrementTable from '@/features/recouvrements/hooks/use-restaurant-recouvrement-table';
import { cn } from '@/lib/utils';

import { PaginationTableau } from '../common/pagination-tableau';

export type restaurantsTableProps = {
  isOptionsLoading?: boolean;
  restoOpts: {
    label: string;
    value: string;
  }[];
};

/**
 * La liste des restaurants du module Recouvrements.
 *
 * <p>Le choix du restaurant était un `react-select` — une troisième bibliothèque de
 * composants dans le même projet — habillé par un objet `styles` en ligne qui imposait
 * une hauteur en dur et n'a jamais suivi le thème. C'est un `ComboBox`.</p>
 */
export function RestaurantsTable({ isOptionsLoading = false, restoOpts }: restaurantsTableProps) {
  const {
    filters,
    handleRestaurantFilterChange,
    isRestaurantError,
    isRestaurantFetching,
    isRestaurantLoading,
    pagination,
    refetchRestaurants,
    restaurantTable,
  } = useRestaurantRecouvrementTable();

  // meme bloc pour les deux rendus (tableau desktop, cartes mobiles) : un seul est visible a la fois
  const zoneErreur = (
    <EtatErreur
      enCours={isRestaurantFetching}
      onReessayer={() => refetchRestaurants()}
      quoi="les restaurants"
    />
  );

  const pageCount = pagination?.pageCount ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-medium text-foreground">
          Liste des restaurants ({pagination?.totalItems ?? 0})
        </h2>
        <ComboBox
          className="w-full max-w-md"
          isDisabled={isOptionsLoading}
          onSelectionChange={(c) => handleRestaurantFilterChange(c ? String(c) : undefined)}
          selectedKey={filters.restoId || null}
        >
          <ComboBox.InputGroup>
            <Input placeholder={isOptionsLoading ? 'Chargement…' : 'Restaurant'} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox items={restoOpts}>
              {(o: { label: string; value: string }) => (
                <ListBox.Item id={o.value} textValue={o.label}>
                  {o.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Restaurants en recouvrement" className="min-w-[52rem]">
                <Table.Header>
                  {restaurantTable.getFlatHeaders().map((header, i) => (
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

                {/* sur echec, l'erreur prend la place du corps vide qui se lirait comme
                    "aucun restaurant" */}
                <Table.Body
                  renderEmptyState={() =>
                    isRestaurantLoading ? null : isRestaurantError ? (
                      <div className="py-6">{zoneErreur}</div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucun restaurant</p>
                    )
                  }
                >
                  {isRestaurantLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {restaurantTable.getFlatHeaders().map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isRestaurantLoading || isRestaurantError
                    ? []
                    : restaurantTable.getRowModel().rows
                  ).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell className={cn(isRestaurantFetching && 'opacity-70')} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {pageCount > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau
                  onPage={pagination.handlePageChange}
                  page={filters.page + 1}
                  total={pageCount}
                />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className={cn('flex flex-col gap-3 md:hidden', isRestaurantFetching && 'opacity-70')}>
        {isRestaurantLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" key={`m-skel-${i}`} />
          ))
        ) : isRestaurantError ? (
          zoneErreur
        ) : restaurantTable.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun restaurant</p>
        ) : (
          restaurantTable
            .getRowModel()
            .rows.map((row) => (
              <RestaurantRecouvrementMobileCard key={row.id} restaurant={row.original} />
            ))
        )}
        {pageCount > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau
              onPage={pagination.handlePageChange}
              page={filters.page + 1}
              total={pageCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
