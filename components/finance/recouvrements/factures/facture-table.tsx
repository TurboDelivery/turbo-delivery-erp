'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import useFactureTable from '@/features/recouvrements/hooks/use-facture-table';
import { FactureFilters } from './facture-filters';
import { subMonths } from 'date-fns';
import { CreerRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/creer-recouvrement-modal';

interface FactureTableProps {
  restaurantId?: string;
  showFilters?: boolean;
  restaurants?: Array<{ label: string; value: string }>; // ✅ AJOUTÉ: Options restaurants
  restaurantsLoading?: boolean; // ✅ AJOUTÉ: Loading restaurants
}

export function FactureTable({ 
  restaurantId, 
  showFilters = true, 
  restaurants,
  restaurantsLoading 
}: FactureTableProps) {
  const { factureTable, isFactureLoading, isFactureFetching, pagination, filters, setFilters, handleTypeFilterChange, handleStatutFilterChange, handlePeriodeFilterChange, handleRestaurantFilterChange } = useFactureTable({
    restaurantId,
  });

  const colsCount = factureTable.getAllColumns().length;

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

      <div className="overflow-x-auto">
        <Table
          isStriped
          bottomContent={
            pagination &&
            pagination.pageCount > 1 && (
              <div className="flex justify-center pt-4 sm:pt-6">
                <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
              </div>
            )
          }
        >
          <TableHeader>
            {factureTable.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucune facture trouvée">
            {isFactureLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : factureTable.getRowModel().rows.map((row) => {
                  const hasContestation = row.original.contestationActive && row.original.contestationActive > 0;
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={`
                        ${isFactureFetching ? 'opacity-70' : ''}
                        ${hasContestation ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : ''}
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
