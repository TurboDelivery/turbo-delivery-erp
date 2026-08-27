'use client';

import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { CreerDepenseModal } from '@/features/depenses/components/depense-list/creer-depense';
import React from 'react';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { flexRender } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import DateFilterInput from '@/components/finance/date-filter-input';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { DollarSign } from 'lucide-react';
import { DepenseMobileCard } from '@/components/depenses/depense-table/depense-mobile-card';
import EtatErreur from '@/components/commons/EtatErreur';

export function DepenseTable() {
  const { table, isLoading, isFetching, isError, refetch, pagination, filters, setSelectedCategories, handleDateChange } = useDepenseTable();

  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense || undefined, // âœ… Convertir null en undefined
  };

  const { data: statsData} = useDepenseStatsQuery(currentSearchParams);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4">
        <CardContent>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Montant Total</p>
                  <p className="text-2xl font-bold text-green-700">{formatCFA(statsData?.montant_total || 0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600">
                  {statsData?.nombre_depenses || 0} dépense{(statsData?.nombre_depenses || 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des dépenses */}
      <Card className="flex flex-col gap-4">
        <CardContent>
          {/* Filtres — toujours visibles (desktop + mobile) */}
          <div className="flex flex-col gap-2 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <DateFilterInput filters={filters} handleDateChange={handleDateChange} variant="outline" />
            <CategoriesSelectFilter selectedCategories={filters.categoriesDepense || []} onCategoriesChange={setSelectedCategories} />
            <CreerDepenseModal />
          </div>

          {/* L'echec de lecture s'affiche ICI, et le message d'etat vide des
              cartes mobiles est neutralise en dessous : sans cela l'ecran
              afficherait l'erreur ET « Aucune depense ». */}
          {isError && (
            <EtatErreur quoi="les dépenses" onReessayer={() => refetch()} enCours={isFetching} />
          )}

          {/* Tableau — desktop uniquement (≥ md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table
              isStriped
              bottomContent={
                pagination?.pageCount! > 1 && (
                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
                  </div>
                )
              }
            >
              <TableHeader>
                {table.getFlatHeaders().map((header) => (
                  <TableColumn className="text-primary" key={header.id} allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {depenseColumns.map((col) => (
                          <TableCell key={`skeleton-cell-${col.header}`} className="h-12">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className={`md:hidden space-y-3 pt-2 ${isFetching ? 'opacity-70' : ''}`}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`m-skel-${i}`} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              isError ? null : <p className="text-sm text-gray-400 text-center py-10">Aucune dépense</p>
            ) : (
              table.getRowModel().rows.map((row) => <DepenseMobileCard key={row.id} depense={row.original} />)
            )}
            {pagination?.pageCount! > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

