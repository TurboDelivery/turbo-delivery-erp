'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrollTable } from '@/features/personnel/hooks/use-payroll-table';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Fevrier' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Aout' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Decembre' },
];

function PayrollTable() {
  const { payrollTable, isPayrollLoading, isPayrollFetching, filters, handleMonthFilterChange, handleYearFilterChange } = usePayrollTable();
  const colsCount = payrollTable.getAllColumns().length;
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const yearOptions = Array.from({ length: Math.max(currentYear - startYear + 1, 1) }, (_, index) => startYear + index);

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="payroll-year">Annee</Label>
          <Select value={String(filters.year)} onValueChange={(value) => handleYearFilterChange(Number(value))}>
            <SelectTrigger id="payroll-year">
              <SelectValue placeholder="Selectionner une annee" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="payroll-month">Mois</Label>
          <Select value={String(filters.month)} onValueChange={(value) => handleMonthFilterChange(Number(value))}>
            <SelectTrigger id="payroll-month">
              <SelectValue placeholder="Selectionner un mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table isStriped>
          <TableHeader>
            {payrollTable.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>

          <TableBody emptyContent="Aucun paiement trouve">
            {isPayrollLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : payrollTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={isPayrollFetching ? 'opacity-70' : ''}>
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

export default PayrollTable;