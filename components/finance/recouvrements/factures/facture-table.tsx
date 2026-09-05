'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Card, Pagination, Table } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import useFactureTable from '@/features/recouvrements/hooks/use-facture-table';
import { FactureFilters } from './facture-filters';
import { subMonths } from 'date-fns';
import { CreerRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/creer-recouvrement-modal';
import { FactureRecouvrementMobileCard } from '@/components/finance/recouvrements/recouvrement-mobile-cards';
import EtatErreur from '@/components/commons/EtatErreur';

interface FactureTableProps {
  restaurantId?: string;
  showFilters?: boolean;
  restaurants?: Array<{ label: string; value: string }>; // ✅ AJOUTÉ: Options restaurants
  restaurantsLoading?: boolean; // ✅ AJOUTÉ: Loading restaurants
}

/** La pagination de la bibliothèque, montée une fois pour le tableau et les cartes. */
function PaginationFactures({
  onPage,
  page,
  total,
}: {
  onPage: (p: number) => void;
  page: number;
  total: number;
}) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <Pagination size="sm">
      <Pagination.Summary>
        Page {page} sur {total}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page === 1} onPress={() => onPage(page - 1)}>
            <Pagination.PreviousIcon />
            Précédent
          </Pagination.Previous>
        </Pagination.Item>
        {pages.map((p) => (
          <Pagination.Item key={p}>
            <Pagination.Link isActive={p === page} onPress={() => onPage(p)}>
              {p}
            </Pagination.Link>
          </Pagination.Item>
        ))}
        <Pagination.Item>
          <Pagination.Next isDisabled={page === total} onPress={() => onPage(page + 1)}>
            Suivant
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}

export function FactureTable({ 
  restaurantId, 
  showFilters = true, 
  restaurants,
  restaurantsLoading 
}: FactureTableProps) {
  const { factureTable, isFactureLoading, isFactureFetching, isFactureError, refetchFactures, pagination, filters, setFilters, handleTypeFilterChange, handleStatutFilterChange, handlePeriodeFilterChange, handleRestaurantFilterChange } = useFactureTable({
    restaurantId,
  });

  const colsCount = factureTable.getAllColumns().length;

  // meme bloc pour les deux rendus (tableau desktop, cartes mobiles) : un seul est visible a la fois
  const zoneErreur = <EtatErreur quoi="les factures" onReessayer={() => refetchFactures()} enCours={isFactureFetching} />;

  const handleResetFilters = () => {
    setFilters({
      type: '',
      statut: '',
      periodeDebut: subMonths(new Date(), 1),
      periodeFin: new Date(),
      page: 0,
    });
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <FactureFilters
          filters={filters}
          handleTypeFilterChange={handleTypeFilterChange}
          handleStatutFilterChange={handleStatutFilterChange}
          handlePeriodeFilterChange={handlePeriodeFilterChange}
          handleRestaurantFilterChange={handleRestaurantFilterChange} // ✅ AJOUTÉ: Handler restaurant
          onReset={handleResetFilters}
          restaurants={restaurants} // ✅ AJOUTÉ: Options restaurants
          restaurantsLoading={restaurantsLoading} // ✅ AJOUTÉ: Loading restaurants
        />
      )}
      <div className="flex justify-end py-1.5">
        <CreerRecouvrementModal variant="outline" />
      </div>

      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Factures" className="min-w-[64rem]">
                <Table.Header>
                  {factureTable.getFlatHeaders().map((header) => (
                    <Table.Column
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader={header.id === 'restaurantName'}
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

                {/* sur echec, l'erreur prend la place de "Aucune facture trouvee" qui se
                    lirait comme un vrai vide */}
                <Table.Body
                  renderEmptyState={() =>
                    isFactureLoading ? null : isFactureError ? (
                      <div className="py-6">{zoneErreur}</div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucune facture trouvée</p>
                    )
                  }
                >
                  {isFactureLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {factureTable.getFlatHeaders().map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isFactureLoading || isFactureError ? [] : factureTable.getRowModel().rows).map(
                    (row) => {
                      const hasContestation =
                        row.original.contestationActive && row.original.contestationActive > 0;
                      return (
                        <Table.Row id={row.id} key={row.id}>
                          {row.getVisibleCells().map((cell, ci) => (
                            <Table.Cell
                              className={cn(
                                isFactureFetching && 'opacity-70',
                                // Une facture contestee garde son lisere : c'est la seule
                                // ligne du tableau qui appelle un geste. `bg-red-50` et
                                // `border-l-red-500` etaient deux teintes de palette.
                                hasContestation && 'bg-danger/5',
                                hasContestation && ci === 0 && 'border-l-4 border-l-danger',
                              )}
                              key={cell.id}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      );
                    },
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {pagination && pagination.pageCount > 1 && (
              <Table.Footer className="justify-center">
                <PaginationFactures
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
      <div className={`md:hidden space-y-3 ${isFactureFetching ? 'opacity-70' : ''}`}>
        {isFactureLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-44 rounded-xl bg-surface-secondary animate-pulse" />)
        ) : isFactureError ? (
          zoneErreur
        ) : factureTable.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">Aucune facture trouvée</p>
        ) : (
          factureTable.getRowModel().rows.map((row) => <FactureRecouvrementMobileCard key={row.id} facture={row.original} />)
        )}
        {pagination && pagination.pageCount > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationFactures
              onPage={pagination.handlePageChange}
              page={pagination.page + 1}
              total={pagination.pageCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
