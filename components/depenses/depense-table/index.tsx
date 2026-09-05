'use client';

import { Card, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import { Wallet } from 'lucide-react';
import React from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { DepenseMobileCard } from '@/components/depenses/depense-table/depense-mobile-card';
import DateFilterInput from '@/components/finance/date-filter-input';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { CreerDepenseModal } from '@/features/depenses/components/depense-list/creer-depense';
import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * Les dépenses de la période.
 *
 * <h3>Ce qui change</h3>
 * <p>Le total était affiché sur un dégradé `from-green-50 to-emerald-50`, bordé de
 * `border-green-200`, avec sa pastille `bg-green-100` et trois nuances de texte vert.
 * Sept classes de la palette Tailwind brute, sans une seule variante sombre — et du VERT
 * pour annoncer ce qu'on a DÉPENSÉ. Le vert de cet ERP dit « c'est bon » ; une somme
 * sortie de la caisse n'est ni bonne ni mauvaise, c'est un fait qu'on lit.</p>
 *
 * <p>Le nombre de dépenses était relégué en petit à droite du montant, dans le même vert.
 * C'est la seconde mesure du bandeau : elle prend sa place à côté de la première.</p>
 *
 * <p>Tous les en-têtes de colonnes étaient peints en `text-primary`, le ROUGE DE MARQUE :
 * sept titres de colonnes en rouge, au-dessus de lignes où rien n'appelle d'action.</p>
 *
 * <p>Enfin, le tableau n'avait PAS d'état vide : une période sans dépense n'affichait rien
 * du tout sous les en-têtes, ni message ni explication. Les cartes mobiles, elles,
 * disaient « Aucune dépense ».</p>
 */
export function DepenseTable() {
  const {
    filters,
    handleDateChange,
    isError,
    isFetching,
    isLoading,
    pagination,
    refetch,
    setSelectedCategories,
    table,
  } = useDepenseTable();

  const currentSearchParams = {
    categoriesDepense: filters.categoriesDepense || undefined,
    debut: filters.debut,
    fin: filters.fin,
  };

  const { data: statsData } = useDepenseStatsQuery(currentSearchParams);
  const nombre = statsData?.nombre_depenses ?? 0;
  const pageCount = pagination?.pageCount ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <GrilleStats colonnes={2}>
        <CarteStat
          icone={Wallet}
          isError={isError}
          isLoading={isLoading}
          libelle="Montant total"
          note="Sur la période retenue"
          valeur={formatCFA(statsData?.montant_total || 0)}
        />
        <CarteStat
          isError={isError}
          isLoading={isLoading}
          libelle="Dépenses"
          note={nombre > 1 ? 'Lignes enregistrées' : 'Ligne enregistrée'}
          valeur={nombre}
        />
      </GrilleStats>

      <Card>
        <Card.Header className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <DateFilterInput filters={filters} handleDateChange={handleDateChange} variant="outline" />
          <CategoriesSelectFilter
            onCategoriesChange={setSelectedCategories}
            selectedCategories={filters.categoriesDepense || []}
          />
          <CreerDepenseModal />
        </Card.Header>

        <Card.Content className="p-0">
          {/* L'echec de lecture s'affiche ICI, et le message d'etat vide des
              cartes mobiles est neutralise en dessous : sans cela l'ecran
              afficherait l'erreur ET « Aucune depense ». */}
          {isError && (
            <div className="p-4">
              <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les dépenses" />
            </div>
          )}

          {/* Tableau — desktop uniquement (≥ md) */}
          <div className="hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Dépenses">
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
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </Table.SortableColumnHeader>
                          ) : (
                            <>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </>
                          )
                        }
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body
                    renderEmptyState={() =>
                      isLoading || isError ? null : (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucune dépense sur la période
                        </p>
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                            {depenseColumns.map((col, j) => (
                              <Table.Cell className="h-12" key={`skeleton-cell-${j}`}>
                                <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <Table.Row
                            className={isFetching ? 'opacity-70' : undefined}
                            id={row.id}
                            key={row.id}
                          >
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
              {pageCount > 1 && (
                <Table.Footer>
                  <PaginationTableau
                    onPage={pagination.handlePageChange}
                    page={filters.page + 1}
                    total={pageCount}
                  />
                </Table.Footer>
              )}
            </Table>
          </div>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className={`flex flex-col gap-3 p-4 md:hidden ${isFetching ? 'opacity-70' : ''}`}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" key={`m-skel-${i}`} />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              isError ? null : (
                <p className="py-10 text-center text-sm text-muted">Aucune dépense sur la période</p>
              )
            ) : (
              table.getRowModel().rows.map((row) => (
                <DepenseMobileCard depense={row.original} key={row.id} />
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
        </Card.Content>
      </Card>
    </div>
  );
}
