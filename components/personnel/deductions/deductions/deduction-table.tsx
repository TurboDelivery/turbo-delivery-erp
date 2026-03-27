'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { useDeductionTable } from '@/features/personnel/hooks/use-deduction-table';
import { DeductionFilters } from '@/components/personnel/deductions/deductions/deduction-filters';
import { IDeduction } from '@/features/personnel/types/deduction.types';

interface DeductionTableProps {
  showFilters?: boolean;
  onEditDeduction?: (deduction: IDeduction) => void;
  onCancelDeduction?: (deduction: IDeduction) => void;
}

export function DeductionTable({ showFilters = true, onEditDeduction, onCancelDeduction }: DeductionTableProps) {
  const {
    deductionTable,
    isDeductionLoading,
    isDeductionFetching,
    pagination,
    filters,
    setFilters,
    handleEmployeeFilterChange,
    handleYearFilterChange,
    handleMonthFilterChange,
  } = useDeductionTable({ onEditDeduction, onCancelDeduction });

  const colsCount = deductionTable.getAllColumns().length;

  const handleResetFilters = () => {
    const now = new Date();

    setFilters({
      employeeId: '',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <DeductionFilters
          filters={filters}
          handleEmployeeFilterChange={handleEmployeeFilterChange}
          handleYearFilterChange={handleYearFilterChange}
          handleMonthFilterChange={handleMonthFilterChange}
          onReset={handleResetFilters}
        />
      )}

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
            {deductionTable.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>

          <TableBody emptyContent="Aucune deduction trouvee">
            {isDeductionLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : deductionTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={isDeductionFetching ? 'opacity-70' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

