'use client';

import React, { useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AddInvestModal } from '../creer-invest/add-invest-modal';
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';
import { Input, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import DateFilterInput from '@/components/finance/date-filter-input';
import { investissementColumns, getDeadlineColor } from './invest-columns';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { InvestDetailModal } from './invest-detail-modal';
import { ModifierInvestModal } from '../modifier/modifier-invest-modal';
import SupprimerInvestModal from '../supprimer/supprimer-invest-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

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
                <TableBody emptyContent={'Aucun investissement'} isLoading={isLoading} loadingContent={<Loader2 className="animate-spin" />}>
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

        {/* Mobile — cartes tactiles (remplace le tableau < md) */}
        <div className="md:hidden space-y-3 p-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)
          ) : (investissements || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun investissement</p>
          ) : (
            (investissements || []).map((inv) => (
              <div key={inv.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 min-w-0 break-words">{inv.nomInvestisseur}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <InvestDetailModal investissement={inv} />
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ModifierInvestModal investissement={inv} />
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <SupprimerInvestModal investissement={inv} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">Date</span>
                  <span className="text-sm text-gray-700">{formatDateFR(inv.dateInvestissement)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">Montant du prêt</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCFA(inv.montant)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">Échéance</span>
                  <span className={`text-sm ${getDeadlineColor(inv.deadline)}`}>{formatDateFR(inv.deadline)}</span>
                </div>
              </div>
            ))
          )}
          {pagination?.pageCount! > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
