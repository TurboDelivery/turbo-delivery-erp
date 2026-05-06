'use client';

import React, { useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AddInvestModal } from '../creer-invest/add-invest-modal';
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';
import { Input, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import DateFilterInput from '@/components/finance/date-filter-input';
import { investissementColumns } from './invest-columns';

export default function InvestissementList() {
  const { investissements, isLoading, filters, handleFilterChange, handleDateChange, pagination } = useInvestissementList();
  const [sorting, setSorting] = useState<SortingState>([]);


  const table = useReactTable({
    data: investissements || [],
    columns: investissementColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="my-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <Input className="max-w-sm" type="text" value={filters.nomInvestisseur ?? ''} onChange={(e) => handleFilterChange('nomInvestisseur', e.target.value)} placeholder="Rechercher par nom..." />
        <div className="flex gap-2">
          <DateFilterInput variant="outline" filters={filters} handleDateChange={handleDateChange} />
          <AddInvestModal />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <div className="space-y-4">
            {/* Tableau HeroUI */}
            <div className="overflow-x-auto">
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
                    <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody emptyContent={'Aucun résultat trouvé.'} isLoading={isLoading} loadingContent={<Loader2 className="animate-spin" />}>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
