'use client';

import React from 'react';
import {
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import DateFilterInput from '@/components/finance/date-filter-input';

const TYPE_DEPENSE_OPTIONS = [
  { key: 'ALL', label: 'Tous les types' },
  { key: 'FIXE', label: 'Fixe' },
  { key: 'VARIABLE', label: 'Variable' },
];

export default function ChargesDepensesDetailsContent() {
  const { table, isLoading, isFetching, pagination, filters, setTypeDepense, handleDateChange } = useDepenseTable();
  const selectedType = filters.typeDepense ?? 'ALL';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <DateFilterInput filters={filters} handleDateChange={handleDateChange} variant="outline" />

        <div className="max-w-xs w-full sm:w-[260px]">
          <Select
            label="Type de depense"
            selectedKeys={[selectedType]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              if (value === 'FIXE' || value === 'VARIABLE') {
                setTypeDepense(value);
                return;
              }
              setTypeDepense(undefined);
            }}
            variant="bordered"
          >
            {TYPE_DEPENSE_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Table
        isStriped
        bottomContent={
          (pagination?.pageCount ?? 0) > 1 && (
            <div className="flex justify-center py-3">
              <Pagination
                total={pagination?.pageCount ?? 1}
                page={(filters.page ?? 0) + 1}
                onChange={pagination.handlePageChange}
                color="primary"
              />
            </div>
          )
        }
      >
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id} className="text-primary">
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`depense-skeleton-${index}`}>
                  {depenseColumns.map((column) => (
                    <TableCell key={`depense-skeleton-cell-${column.id ?? column.header?.toString() ?? index}`}>
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={isFetching ? 'opacity-70' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}


