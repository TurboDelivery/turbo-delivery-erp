'use client';

import React from 'react';
import { useRecouvrementTable } from '@/features/recouvrements/hooks/use-recouvrement-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { Pagination } from '@/components/heroui';
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
      <div className="hidden md:block overflow-x-auto">
        <Table isStriped>
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          {/* sur echec, l'erreur prend la place du message "Aucun recouvrement" qui se lirait comme un resultat vide */}
          <TableBody emptyContent={isLoading ? ' ' : isError ? zoneErreur : 'Aucun recouvrement'}>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
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
      <div className={`md:hidden space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />)
        ) : isError ? (
          zoneErreur
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun recouvrement</p>
        ) : (
          table.getRowModel().rows.map((row) => <RecouvrementMobileCard key={row.id} recouvrement={row.original} />)
        )}
      </div>

      {pagination && pagination.pageCount > 1 && (
        <div className="flex justify-center pt-4 sm:pt-6">
          <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
        </div>
      )}
    </div>
  );
}
